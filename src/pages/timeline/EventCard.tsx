// 事项卡片组件

import { TimelineEvent, EventPosition } from './types';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface EventCardProps {
  event: TimelineEvent;
  position: EventPosition;
  onClick?: (event: TimelineEvent) => void;
}

const EVENT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100',
  'bg-green-100 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-100',
  'bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-100',
  'bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-100',
  'bg-pink-100 border-pink-300 text-pink-900 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-100',
];

export function EventCard({ event, position, onClick }: EventCardProps) {
  const { top, height, column, totalColumns } = position;
  
  // 计算卡片宽度和偏移
  const width = totalColumns > 1 ? `${100 / totalColumns - 1}%` : '98%';
  const left = totalColumns > 1 ? `${(column * 100) / totalColumns}%` : '1%';
  
  // 选择颜色（基于事项ID哈希）
  const colorIndex = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % EVENT_COLORS.length;
  const colorClass = EVENT_COLORS[colorIndex];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  return (
    <Card
      className={`absolute overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${colorClass}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left,
        width,
      }}
      onClick={handleClick}
    >
      <div className="p-2 h-full flex flex-col gap-1">
        {/* 标题 */}
        <div className="font-semibold text-sm truncate">
          {event.title}
        </div>
        
        {/* 时间 */}
        <div className="flex items-center gap-1 text-xs opacity-80">
          <Clock className="w-3 h-3" />
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        
        {/* 内容预览 */}
        {event.content && height > 80 && (
          <div className="text-xs opacity-70 line-clamp-2 mt-1">
            {event.content}
          </div>
        )}
      </div>
    </Card>
  );
}
