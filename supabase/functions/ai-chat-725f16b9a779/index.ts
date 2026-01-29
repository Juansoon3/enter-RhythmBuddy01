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
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_725f16b9a779");
    if (!AI_API_TOKEN) {
      throw new Error("AI_API_TOKEN is not configured");
    }

    const { messages, model } = await req.json();

    // 添加系统提示词
    const systemMessage = {
      role: "user",
      content: `你是「一起喝水」时间管理应用的AI助手，名叫"小水滴"。你的职责是：
1. 帮助用户规划时间和管理事项
2. 提供番茄工作法和时间管理建议
3. 提醒用户注意休息和喝水
4. 分析时间安排的合理性
5. 根据对话快速创建待办事项

回复风格：友好、简洁、鼓励。请用中文回复。`
    };

    // 将系统提示词添加到消息开头
    const messagesWithSystem = messages.length === 1 
      ? [systemMessage, ...messages]
      : messages;

    const response = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "anthropic/claude-sonnet-4.5",
        messages: messagesWithSystem,
        stream: true,
      }),
    });

    if (!response.ok) {
      // Parse upstream SSE error response
      const text = await response.text();
      let errorMessage = "AI service error";
      let errorCode = "api_error";
      
      const dataMatch = text.match(/data: (.+)/);
      if (dataMatch) {
        try {
          const errorData = JSON.parse(dataMatch[1]);
          errorMessage = errorData.error?.message || errorMessage;
          errorCode = errorData.error?.type || errorCode;
        } catch { /* use defaults */ }
      }
      
      // Return error in SSE format
      const errorSSE = `event: error\ndata: ${JSON.stringify({
        type: "error",
        error: { type: errorCode, message: errorMessage }
      })}\n\n`;
      
      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
      });
    }

    // Stream SSE response to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
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