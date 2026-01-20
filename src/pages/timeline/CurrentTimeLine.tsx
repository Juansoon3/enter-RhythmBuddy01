// 当前时间指示线组件

import { useState, useEffect } from 'react';
import { timeToMinutes, TIME_SLOT_HEIGHT } from '@/lib/timeline-utils';

export function CurrentTimeLine() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 每分钟更新一次当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 每分钟更新

    return () => clearInterval(timer);
  }, []);

  // 计算当前时间在时间轴上的位置
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const totalMinutes = timeToMinutes(timeString);
  const pixelsPerMinute = TIME_SLOT_HEIGHT / 30;
  const topPosition = totalMinutes * pixelsPerMinute;

  return (
    <div
      className="absolute left-16 right-0 z-10 pointer-events-none"
      style={{ top: `${topPosition}px` }}
    >
      {/* 时间标签 */}
      <div className="absolute -left-16 -top-3 w-16 pr-2 text-right">
        <span className="inline-block px-2 py-0.5 text-xs font-semibold text-primary bg-primary/10 rounded">
          {timeString}
        </span>
      </div>
      
      {/* 指示线 */}
      <div className="relative">
        <div className="h-0.5 bg-primary shadow-lg">
          {/* 圆点 */}
          <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-primary rounded-full shadow-lg" />
        </div>
      </div>
    </div>
  );
}
