// 日期导航组件

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ currentDate, onDateChange }: DateNavigatorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePreviousDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsCalendarOpen(false);
    }
  };

  // 格式化日期显示
  const dateDisplay = format(currentDate, 'yyyy年MM月dd日');
  const weekDay = format(currentDate, 'EEEE', { locale: undefined });
  
  // 周几的中文映射
  const weekDayMap: Record<string, string> = {
    'Monday': '周一',
    'Tuesday': '周二',
    'Wednesday': '周三',
    'Thursday': '周四',
    'Friday': '周五',
    'Saturday': '周六',
    'Sunday': '周日',
  };

  return (
    <div className="flex items-center gap-2">
      {/* 前一天按钮 */}
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousDay}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 日期选择器 */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-9 gap-2 px-3',
              isToday(currentDate) && 'border-primary text-primary'
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <span className="font-medium">{dateDisplay}</span>
              <span className="text-xs text-muted-foreground">
                {weekDayMap[weekDay] || weekDay}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleCalendarSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* 后一天按钮 */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextDay}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 今天按钮 */}
      {!isToday(currentDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToday}
          className="h-9 px-3 text-primary"
        >
          今天
        </Button>
      )}
    </div>
  );
}
