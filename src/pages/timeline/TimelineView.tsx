// 时间轴视图组件

import { useState, useMemo, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TimeSlot } from './TimeSlot';
import { EventCard } from './EventCard';
import { EventDialog } from './EventDialog';
import { CurrentTimeLine } from './CurrentTimeLine';
import { TimelineEvent } from './types';
import { generateTimeSlots, calculateEventColumns, roundToNearestHalfHour, timeToMinutes, TIME_SLOT_HEIGHT, getCurrentTime } from '@/lib/timeline-utils';
import { useTimelineEvents } from '@/hooks/use-timeline-events';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

export function TimelineView() {
  const { events, addEvent, updateEvent, deleteEvent } = useTimelineEvents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [defaultTime, setDefaultTime] = useState<string | undefined>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [lastAddedEventId, setLastAddedEventId] = useState<string | null>(null);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const eventPositions = useMemo(() => calculateEventColumns(events), [events]);

  // 页面初始加载时滚动到当前时间
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToTime(getCurrentTime());
    }, 300); // 延迟300ms等待渲染完成

    return () => clearTimeout(timer);
  }, []); // 只在初始加载时执行

  // 滚动到指定时间
  const scrollToTime = (time: string) => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      const minutes = timeToMinutes(time);
      const pixelsPerMinute = TIME_SLOT_HEIGHT / 30;
      const scrollTop = minutes * pixelsPerMinute - 100; // 减100px让事项显示在视口中间偏上
      viewport.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
    }
  };

  // 当添加新事项后，自动滚动到该事项位置
  useEffect(() => {
    if (lastAddedEventId) {
      const event = events.find(e => e.id === lastAddedEventId);
      if (event) {
        scrollToTime(event.startTime);
        setLastAddedEventId(null);
      }
    }
  }, [lastAddedEventId, events]);

  // 点击时间槽添加事项
  const handleTimeSlotClick = (time: string) => {
    setSelectedEvent(null);
    setDefaultTime(roundToNearestHalfHour(time));
    setDialogOpen(true);
  };

  // 点击事项卡片编辑
  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setDefaultTime(undefined);
    setDialogOpen(true);
  };

  // 保存事项
  const handleSave = (values: Omit<TimelineEvent, 'id'>, eventId?: string) => {
    if (eventId) {
      updateEvent(eventId, values);
      toast.success('事项已更新');
    } else {
      const newEvent = addEvent(values);
      setLastAddedEventId(newEvent.id);
      toast.success('事项已添加');
    }
  };

  // 删除事项
  const handleDelete = (eventId: string) => {
    deleteEvent(eventId);
    toast.success('事项已删除');
  };

  // 计算时间轴总高度 (48个时间槽 x 60px)
  const timelineHeight = timeSlots.length * 60;

  return (
    <>
      <div className="relative h-full w-full">
        <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
          <div 
            className="relative bg-background"
            style={{ height: `${timelineHeight}px` }}
          >
            {/* 时间槽列表 */}
            <div className="relative">
              {timeSlots.map((slot) => (
                <TimeSlot
                  key={slot.time}
                  slot={slot}
                  onClick={handleTimeSlotClick}
                />
              ))}
            </div>

            {/* 事项卡片层 */}
            <div 
              className="absolute top-0 left-16 right-0 pointer-events-none"
              style={{ height: `${timelineHeight}px` }}
            >
              <div className="relative h-full pointer-events-auto">
                {events.map((event) => {
                  const position = eventPositions.get(event.id);
                  if (!position) return null;

                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      position={position}
                      onClick={handleEventClick}
                    />
                  );
                })}
              </div>
            </div>

            {/* 当前时间指示线 */}
            <CurrentTimeLine />
          </div>
        </ScrollArea>

        {/* 回到当前时间按钮 */}
        <Button
          size="sm"
          variant="outline"
          className="absolute bottom-4 left-4 shadow-lg bg-background/95 backdrop-blur"
          onClick={() => scrollToTime(getCurrentTime())}
        >
          <Clock className="w-4 h-4 mr-2" />
          当前时间
        </Button>
      </div>

      {/* 事项编辑对话框 */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        defaultTime={defaultTime}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
