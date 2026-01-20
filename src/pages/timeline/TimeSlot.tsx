// 时间槽组件

import { TimeSlot as TimeSlotType } from './types';
import { TIME_SLOT_HEIGHT } from '@/lib/timeline-utils';

interface TimeSlotProps {
  slot: TimeSlotType;
  onClick?: (time: string) => void;
}

export function TimeSlot({ slot, onClick }: TimeSlotProps) {
  const handleClick = () => {
    onClick?.(slot.time);
  };

  return (
    <div
      className="relative flex border-t border-border transition-colors hover:bg-accent/5 cursor-pointer"
      style={{ height: `${TIME_SLOT_HEIGHT}px` }}
      onClick={handleClick}
    >
      {/* 时间标签 */}
      <div className="w-16 flex-shrink-0 pr-3 text-right">
        <span className="text-xs text-muted-foreground font-medium">
          {slot.time}
        </span>
      </div>
      
      {/* 时间线区域 */}
      <div className="flex-1 relative">
        {/* 半小时分隔线 */}
        {slot.minute === 30 && (
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border/50" />
        )}
      </div>
    </div>
  );
}
