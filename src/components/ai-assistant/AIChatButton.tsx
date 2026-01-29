// AI助理悬浮球按钮（可拖拽）

import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const STORAGE_KEY = 'ai-chat-button-position';

export function AIChatButton({ onClick, isOpen }: AIChatButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 加载保存的位置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        setPosition({ x, y });
      } catch {
        // 使用默认位置
        setPosition({ x: window.innerWidth - 88, y: window.innerHeight - 160 });
      }
    } else {
      // 默认位置：右下角，在添加事项按钮上方
      setPosition({ x: window.innerWidth - 88, y: window.innerHeight - 160 });
    }
  }, []);

  // 保存位置
  const savePosition = (pos: { x: number; y: number }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  };

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果窗口已打开，点击关闭
    if (isOpen) {
      onClick();
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 监听鼠标事件
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;

      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleUp = (e: MouseEvent) => {
      if (!isDragging) return;

      const distance = Math.sqrt(
        Math.pow(e.clientX - dragStart.x - position.x, 2) +
        Math.pow(e.clientY - dragStart.y - position.y, 2)
      );

      if (distance < 5) {
        onClick();
      }

      setIsDragging(false);
      savePosition(position);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, dragStart, position, onClick]);

  // 触摸事件支持（移动端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) {
      onClick();
      return;
    }

    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;

    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: boundedX, y: boundedY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    savePosition(position);
  };

  return (
    <Button
      ref={buttonRef}
      size="lg"
      className={cn(
        'fixed h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 transition-all z-40',
        isDragging && 'cursor-grabbing scale-110',
        !isDragging && !isOpen && 'cursor-grab hover:scale-110',
        isOpen && 'opacity-80'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Sparkles className={cn(
        'w-6 h-6 text-white transition-transform',
        isOpen && 'rotate-180'
      )} />
      
      {/* 呼吸灯效果 */}
      {!isOpen && !isDragging && (
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 animate-ping opacity-20" />
      )}
    </Button>
  );
}
