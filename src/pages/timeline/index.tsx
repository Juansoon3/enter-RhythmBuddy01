// 「一起喝水」主页 - 时间表

import { useState } from 'react';
import { TimelineView } from './TimelineView';
import { DateNavigator } from './DateNavigator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { EventDialog } from './EventDialog';
import { useTimelineEvents } from '@/hooks/use-timeline-events';
import { getCurrentTime } from '@/lib/timeline-utils';

export default function Timeline() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { addEvent, updateEvent, deleteEvent, events } = useTimelineEvents(currentDate);
  const [fabDialogOpen, setFabDialogOpen] = useState(false);

  const todayEventsCount = events.length;

  const handleFabClick = () => {
    setFabDialogOpen(true);
  };

  const handleSave = async (values: Omit<import('./types').TimelineEvent, 'id'>, eventId?: string) => {
    try {
      // 添加日期字段
      const eventWithDate = {
        ...values,
        eventDate: format(currentDate, 'yyyy-MM-dd'),
      };
      
      if (eventId) {
        await updateEvent(eventId, eventWithDate);
      } else {
        await addEvent(eventWithDate);
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
      {/* 顶部标题栏 */}
      <header className="flex-shrink-0 bg-background/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* 应用标题 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                水
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">一起喝水</h1>
                <p className="text-xs text-muted-foreground">时间管理 · 健康生活</p>
              </div>
            </div>

            {/* 日期导航和统计 */}
            <div className="flex items-center gap-3">
              <DateNavigator 
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
              
              {todayEventsCount > 0 && (
                <Card className="px-3 py-2 bg-primary/10 border-primary/20">
                  <span className="text-sm font-semibold text-primary">
                    {todayEventsCount} 个事项
                  </span>
                </Card>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 时间表主内容 */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full container mx-auto px-4 py-4">
          <Card className="h-full overflow-hidden shadow-xl bg-card/95 backdrop-blur">
            <TimelineView currentDate={currentDate} />
          </Card>
        </div>
      </main>

      {/* 悬浮添加按钮 (FAB) */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all hover:scale-110"
        onClick={handleFabClick}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* FAB 对话框 */}
      <EventDialog
        open={fabDialogOpen}
        onOpenChange={setFabDialogOpen}
        defaultTime={getCurrentTime()}
        onSave={handleSave}
        onDelete={deleteEvent}
      />
    </div>
  );
}
