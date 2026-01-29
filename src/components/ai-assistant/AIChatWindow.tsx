// AI聊天窗口组件

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatMessage } from './ChatMessage';
import { useAIChat } from '@/hooks/use-ai-chat';
import { Send, X, Trash2, Sparkles, Settings } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIChatWindowProps {
  onClose: () => void;
}

export function AIChatWindow({ onClose }: AIChatWindowProps) {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen-plus');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    model: selectedModel,
  });

  // 自动滚动到底部
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleClear = () => {
    if (confirm('确定要清空对话历史吗？')) {
      clearMessages();
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-300">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">小水滴助手</h3>
            <p className="text-xs text-muted-foreground">阿里云百炼 · {getModelName(selectedModel)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClear}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="px-4 py-3 border-b bg-muted/20">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">选择模型</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qwen-turbo">通义千问-Turbo（快速）</SelectItem>
                <SelectItem value="qwen-plus">通义千问-Plus（均衡）⭐</SelectItem>
                <SelectItem value="qwen-max">通义千问-Max（高质量）</SelectItem>
                <SelectItem value="qwen-long">通义千问-Long（长文本）</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              切换模型后，新对话将使用选择的模型
            </p>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">你好！我是小水滴</h4>
                <p className="text-xs text-muted-foreground">
                  我可以帮你规划时间、管理事项<br />
                  试试问我："今天该做些什么？"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 pt-2">
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-muted/20">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          按 Enter 发送消息
        </p>
      </form>
    </div>
  );
}

function getModelName(model: string): string {
  const modelNames: Record<string, string> = {
    'qwen-turbo': 'Turbo',
    'qwen-plus': 'Plus',
    'qwen-max': 'Max',
    'qwen-long': 'Long',
  };
  return modelNames[model] || model;
}
