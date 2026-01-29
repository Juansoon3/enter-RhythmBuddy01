// 时间轴视图组件

import { useState, useMemo, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeSlot } from './TimeSlot';
import { EventCard } from './EventCard';
import { EventDialog } from './EventDialog';
import { CurrentTimeLine } from './CurrentTimeLine';
import { TimelineEvent } from './types';
import { generateTimeSlots, calculateEventColumns, roundToNearestHalfHour, timeToMinutes, TIME_SLOT_HEIGHT, getCurrentTime } from '@/lib/timeline-utils';
import { useTimelineEvents } from '@/hooks/use-timeline-events';
import { toast } from 'sonner';
import { Clock, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineViewProps {
  currentDate: Date;
}

export function TimelineView({ currentDate }: TimelineViewProps) {
  const { events, addEvent, updateEvent, deleteEvent, isLoading } = useTimelineEvents(currentDate);
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
  const handleSave = async (values: Omit<TimelineEvent, 'id'>, eventId?: string) => {
    try {
      // 确保包含日期字段
      const eventWithDate = {
        ...values,
        eventDate: format(currentDate, 'yyyy-MM-dd'),
      };
      
      if (eventId) {
        await updateEvent(eventId, eventWithDate);
        toast.success('事项已更新');
      } else {
        const newEvent = await addEvent(eventWithDate);
        setLastAddedEventId(newEvent.id);
        toast.success('事项已添加');
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error('保存失败，请重试');
    }
  };

  // 删除事项
  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast.success('事项已删除');
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 计算时间轴总高度 (48个时间槽 x 60px)
  const timelineHeight = timeSlots.length * 60;

  // 加载状态
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <p className="text-sm text-muted-foreground">加载事项中...</p>
        </div>
      </div>
    );
  }

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
                {events.length === 0 ? (
                  // 空状态提示
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-3 p-8 bg-muted/30 rounded-lg backdrop-blur-sm border border-border/50">
                      <CalendarPlus className="w-12 h-12 mx-auto text-muted-foreground/50" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">还没有事项</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          点击时间槽或右下角按钮添加第一个事项
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  events.map((event) => {
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
                  })
                )}
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
