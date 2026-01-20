// 时间轴工具函数

import { TimeSlot, TimelineEvent, EventPosition } from "@/pages/timeline/types";

// 每个时间槽的高度（像素）
export const TIME_SLOT_HEIGHT = 60;

/**
 * 生成24小时的时间槽数组（48个半小时单位）
 */
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push({
        time: formatTime(hour, minute),
        hour,
        minute,
      });
    }
  }
  
  return slots;
}

/**
 * 格式化时间显示 (HH:mm)
 */
export function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * 将时间字符串转换为分钟数（从00:00开始）
 */
export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

/**
 * 将分钟数转换为时间字符串
 */
export function minutesToTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return formatTime(hour, minute);
}

/**
 * 计算事项在时间轴上的位置和高度
 */
export function calculateEventPosition(event: TimelineEvent): { top: number; height: number } {
  const startMinutes = timeToMinutes(event.startTime);
  const endMinutes = timeToMinutes(event.endTime);
  const duration = endMinutes - startMinutes;
  
  // 每分钟对应的像素高度
  const pixelsPerMinute = TIME_SLOT_HEIGHT / 30;
  
  return {
    top: startMinutes * pixelsPerMinute,
    height: Math.max(duration * pixelsPerMinute, 40), // 最小高度40px
  };
}

/**
 * 检测两个事项是否有时间重叠
 */
export function eventsOverlap(event1: TimelineEvent, event2: TimelineEvent): boolean {
  const start1 = timeToMinutes(event1.startTime);
  const end1 = timeToMinutes(event1.endTime);
  const start2 = timeToMinutes(event2.startTime);
  const end2 = timeToMinutes(event2.endTime);
  
  return start1 < end2 && start2 < end1;
}

/**
 * 计算事项的横向分布（处理重叠事项）
 */
export function calculateEventColumns(events: TimelineEvent[]): Map<string, EventPosition> {
  const positions = new Map<string, EventPosition>();
  
  // 按开始时间排序
  const sortedEvents = [...events].sort((a, b) => 
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  
  // 分组重叠的事项
  const groups: TimelineEvent[][] = [];
  
  for (const event of sortedEvents) {
    let placed = false;
    
    for (const group of groups) {
      // 检查是否与组内任何事项重叠
      const overlaps = group.some(e => eventsOverlap(e, event));
      
      if (overlaps) {
        group.push(event);
        placed = true;
        break;
      }
    }
    
    if (!placed) {
      groups.push([event]);
    }
  }
  
  // 为每个组内的事项分配列位置
  for (const group of groups) {
    const columns: TimelineEvent[][] = [];
    
    for (const event of group) {
      let columnIndex = 0;
      
      // 找到第一个不冲突的列
      while (columnIndex < columns.length) {
        const column = columns[columnIndex];
        const conflicts = column.some(e => eventsOverlap(e, event));
        
        if (!conflicts) {
          break;
        }
        
        columnIndex++;
      }
      
      if (columnIndex >= columns.length) {
        columns.push([]);
      }
      
      columns[columnIndex].push(event);
      
      const { top, height } = calculateEventPosition(event);
      
      positions.set(event.id, {
        top,
        height,
        column: columnIndex,
        totalColumns: columns.length,
      });
    }
  }
  
  return positions;
}

/**
 * 验证时间格式 (HH:mm)
 */
export function isValidTime(time: string): boolean {
  const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return regex.test(time);
}

/**
 * 获取当前时间 (HH:mm)
 */
export function getCurrentTime(): string {
  const now = new Date();
  return formatTime(now.getHours(), now.getMinutes());
}

/**
 * 调整时间到最近的半小时
 */
export function roundToNearestHalfHour(time: string): string {
  const minutes = timeToMinutes(time);
  const rounded = Math.round(minutes / 30) * 30;
  return minutesToTime(rounded);
}
