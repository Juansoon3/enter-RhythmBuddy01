// 聊天消息组件

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from './types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showThinking, setShowThinking] = useState(true);

  // 当内容开始流式输出时自动折叠思考过程
  useEffect(() => {
    if (message.content && message.thinking) {
      setShowThinking(false);
    }
  }, [message.content, message.thinking]);

  const isWaitingForContent = message.isStreaming && !message.thinking && !message.content;

  return (
    <div
      className={cn(
        'flex w-full gap-3 px-4 py-4',
        message.role === 'user' ? 'bg-accent/20' : 'bg-background'
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white'
        )}
      >
        {message.role === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        {/* 等待加载 */}
        {isWaitingForContent && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>思考中...</span>
          </div>
        )}

        {/* 思考过程 */}
        {message.thinking && (
          <div>
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showThinking ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span className="font-medium">思考过程</span>
            </button>

            {showThinking && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground whitespace-pre-wrap border border-border/50">
                {message.thinking}
                {message.isStreaming && !message.content && (
                  <span className="inline-block w-1 h-3.5 bg-current animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>
        )}

        {/* 主内容 */}
        {message.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
