// AI对话管理Hook

import { useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { ChatMessage } from '@/components/ai-assistant/types';

const FALLBACK_MESSAGES: Record<string, string> = {
  authentication_error: '认证失败，请刷新页面',
  rate_limit_error: '请求过于频繁，请稍后再试',
  invalid_request_error: '请求无效，请重试',
  overloaded_error: '服务繁忙，请稍后再试',
  insufficient_credits: 'AI配额已用尽，请联系管理员',
  permission_error: 'AI功能已被禁用，请联系管理员',
  api_error: '服务暂时不可用',
};

function getUserErrorMessage(code: string, backendMessage: string): string {
  return backendMessage || FALLBACK_MESSAGES[code] || '服务暂时不可用';
}

interface UseAIChatOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  model?: string;
}

export function useAIChat({ supabaseUrl, supabaseAnonKey, model = 'anthropic/claude-sonnet-4.5' }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      thinking: '',
      isStreaming: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);

    const blocks = new Map<number, { type: string; content: string }>();

    try {
      await fetchEventSource(`${supabaseUrl}/functions/v1/ai-chat-725f16b9a779`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          model,
        }),
        signal: abortControllerRef.current.signal,

        async onopen(response) {
          const contentType = response.headers.get('content-type');

          if (!response.ok) {
            if (contentType?.includes('text/event-stream')) {
              const text = await response.text();
              const dataMatch = text.match(/data: (.+)/);
              if (dataMatch) {
                try {
                  const errorData = JSON.parse(dataMatch[1]);
                  if (errorData.type === 'error' && errorData.error?.message) {
                    throw new Error(errorData.error.message);
                  }
                } catch (parseError) {
                  if (parseError instanceof Error && parseError.message !== 'Unexpected token') {
                    throw parseError;
                  }
                }
              }
            }

            if (contentType?.includes('application/json')) {
              const errorData = await response.json();
              throw new Error(errorData.error?.message || errorData.error || `请求失败: ${response.status}`);
            }

            throw new Error(`请求失败: ${response.status}`);
          }

          if (!contentType?.includes('text/event-stream')) {
            throw new Error(`期望 text/event-stream，实际: ${contentType}`);
          }
        },

        onmessage(event) {
          if (!event.data) return;
          const data = JSON.parse(event.data);

          if (data.type === 'error') {
            const errorMsg = getUserErrorMessage(
              data.error?.type || 'api_error',
              data.error?.message || '服务错误'
            );
            setError(errorMsg);
            setMessages(prev => prev.slice(0, -1));
            setIsLoading(false);
            return;
          }

          switch (data.type) {
            case 'content_block_start': {
              blocks.set(data.index, { type: data.content_block.type, content: '' });
              break;
            }
            case 'content_block_delta': {
              const block = blocks.get(data.index);
              if (block?.type === 'thinking') {
                block.content += data.delta.thinking || '';
                setMessages(prev => updateLastAssistant(prev, { thinking: block.content }));
              } else if (block?.type === 'text') {
                block.content += data.delta.text || '';
                setMessages(prev => updateLastAssistant(prev, { content: block.content }));
              }
              break;
            }
            case 'message_stop': {
              setMessages(prev => updateLastAssistant(prev, { isStreaming: false }));
              break;
            }
          }
        },

        onerror(err) {
          throw err;
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || '发送消息失败');
        setMessages(prev => prev.slice(0, -1)); // 移除未完成的消息
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, supabaseUrl, supabaseAnonKey, model]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancel,
    clearMessages,
  };
}

function updateLastAssistant(messages: ChatMessage[], updates: Partial<ChatMessage>): ChatMessage[] {
  const updated = [...messages];
  const last = updated[updated.length - 1];
  if (last?.role === 'assistant') {
    Object.assign(last, updates);
  }
  return updated;
}
