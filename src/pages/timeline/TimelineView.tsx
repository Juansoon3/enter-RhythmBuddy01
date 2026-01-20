// 时间轴视图组件

import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimeSlot } from './TimeSlot';
import { EventCard } from './EventCard';
import { EventDialog } from './EventDialog';
import { TimelineEvent } from './types';
import { generateTimeSlots, calculateEventColumns, roundToNearestHalfHour } from '@/lib/timeline-utils';
import { useTimelineEvents } from '@/hooks/use-timeline-events';

export function TimelineView() {
  const { events, addEvent, updateEvent, deleteEvent } = useTimelineEvents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [defaultTime, setDefaultTime] = useState<string | undefined>();

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const eventPositions = useMemo(() => calculateEventColumns(events), [events]);

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
    } else {
      addEvent(values);
    }
  };

  // 删除事项
  const handleDelete = (eventId: string) => {
    deleteEvent(eventId);
  };

  return (
    <>
      <ScrollArea className="h-full w-full">
        <div className="relative min-h-full bg-background">
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
          <div className="absolute top-0 left-16 right-0 pointer-events-none">
            <div className="relative pointer-events-auto">
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
        </div>
      </ScrollArea>

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
