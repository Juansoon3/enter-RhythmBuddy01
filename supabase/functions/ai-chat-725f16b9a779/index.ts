import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BAILIAN_API_KEY = Deno.env.get("BAILIAN_API_KEY");
    if (!BAILIAN_API_KEY) {
      throw new Error("BAILIAN_API_KEY is not configured");
    }

    const { messages, model } = await req.json();

    // 优化的系统提示词 - 明确身份信息
    const systemPrompt = `你是「一起喝水」时间管理应用的AI助手，名叫"小水滴"。

关于你的身份：
- 你是基于阿里云通义千问大语言模型（${model || 'qwen-plus'}）构建的AI助手
- 你可以诚实地告诉用户你是什么模型，但同时要说明你在这个应用中扮演"小水滴"的角色
- 当用户问及你的身份时，可以回答："我是基于阿里云通义千问大模型的AI助手，在「一起喝水」应用中，大家都叫我小水滴。"

你的职责：
1. 帮助用户规划时间和管理事项
2. 提供番茄工作法和时间管理建议
3. 提醒用户注意休息和喝水
4. 分析时间安排的合理性
5. 根据对话快速创建待办事项建议

回复风格：
- 友好、简洁、鼓励
- 用中文回复
- 可以使用emoji让对话更生动
- 保持专业但不失亲和力`;

    // 构建阿里云百炼API格式的消息
    const bailianMessages = messages.map((msg: any, index: number) => {
      if (index === 0) {
        // 第一条消息添加系统提示
        return {
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.role === "user" ? `${systemPrompt}\n\n${msg.content}` : msg.content
        };
      }
      return {
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      };
    });

    // 调用阿里云百炼API（DashScope）
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BAILIAN_API_KEY}`,
        "Content-Type": "application/json",
        "X-DashScope-SSE": "enable", // 启用SSE流式输出
      },
      body: JSON.stringify({
        model: model || "qwen-plus",
        input: {
          messages: bailianMessages
        },
        parameters: {
          result_format: "message",
          incremental_output: true, // 增量输出
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "AI服务错误";
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      // 返回错误（SSE格式）
      const errorSSE = `event: error\ndata: ${JSON.stringify({
        type: "error",
        error: { type: "api_error", message: errorMessage }
      })}\n\n`;
      
      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
      });
    }

    // 发送初始事件并转换流式响应
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // 发送 message_start
        const messageStart = {
          type: "message_start",
          message: {
            id: `msg-${Date.now()}`,
            model: model || "qwen-plus"
          }
        };
        controller.enqueue(encoder.encode(`event: message_start\ndata: ${JSON.stringify(messageStart)}\n\n`));
        
        // 发送 content_block_start
        const blockStart = {
          type: "content_block_start",
          index: 0,
          content_block: {
            type: "text",
            text: ""
          }
        };
        controller.enqueue(encoder.encode(`event: content_block_start\ndata: ${JSON.stringify(blockStart)}\n\n`));
        
        // 流式读取阿里云百炼的响应
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += new TextDecoder().decode(value);
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留不完整的行
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const data = JSON.parse(line.slice(5).trim());
                  
                  // 处理阿里云百炼的响应
                  if (data.output?.choices?.[0]?.message?.content) {
                    const content = data.output.choices[0].message.content;
                    const delta = {
                      type: "content_block_delta",
                      index: 0,
                      delta: { type: "text_delta", text: content }
                    };
                    controller.enqueue(encoder.encode(`event: content_block_delta\ndata: ${JSON.stringify(delta)}\n\n`));
                  }
                  
                  if (data.output?.finish_reason === 'stop') {
                    const blockStop = { type: "content_block_stop", index: 0 };
                    controller.enqueue(encoder.encode(`event: content_block_stop\ndata: ${JSON.stringify(blockStop)}\n\n`));
                    
                    const messageStop = { type: "message_stop" };
                    controller.enqueue(encoder.encode(`event: message_stop\ndata: ${JSON.stringify(messageStop)}\n\n`));
                  }
                  
                  if (data.code && data.code !== 200) {
                    const error = {
                      type: "error",
                      error: { type: "api_error", message: data.message || "服务错误" }
                    };
                    controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(error)}\n\n`));
                  }
                } catch (e) {
                  // 忽略JSON解析错误
                }
              }
            }
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    const errorSSE = `event: error\ndata: ${JSON.stringify({
      type: "error",
      error: { type: "api_error", message: error.message }
    })}\n\n`;
    
    return new Response(errorSSE, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
    });
  }
});
