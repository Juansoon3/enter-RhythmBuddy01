// 时间轴事项数据类型定义

export interface TimelineEvent {
  id: string;                    // 唯一标识 (UUID from Supabase)
  title: string;                 // 事项名称（7字以内）
  startTime: string;             // 开始时间 (HH:mm格式)
  endTime: string;               // 结束时间 (HH:mm格式)
  content: string;               // 事项内容
  notes?: string;                // 事项备注（可选）
  color?: string;                // 事项颜色标记（可选）
  eventDate: string;             // 事项日期 (YYYY-MM-DD格式)
}

export interface TimeSlot {
  time: string;                  // 时间标签 (HH:mm)
  hour: number;                  // 小时 (0-23)
  minute: number;                // 分钟 (0 或 30)
}

export interface EventPosition {
  top: number;                   // 相对于时间轴顶部的位置 (px)
  height: number;                // 事项卡片高度 (px)
  column: number;                // 横向列位置 (0, 1, 2...)
  totalColumns: number;          // 该时间段总列数
}
