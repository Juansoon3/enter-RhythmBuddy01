// 时间轴事项管理Hook - 使用 Supabase

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimelineEvent } from '@/pages/timeline/types';
import type { Database } from '@/integrations/supabase/types';

type DbTimelineEvent = Database['public']['Tables']['timeline_events']['Row'];
type DbTimelineEventInsert = Database['public']['Tables']['timeline_events']['Insert'];

/**
 * 将数据库事项转换为前端类型
 */
function dbEventToTimelineEvent(dbEvent: DbTimelineEvent): TimelineEvent {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    startTime: dbEvent.start_time,
    endTime: dbEvent.end_time,
    content: dbEvent.content,
    notes: dbEvent.notes || undefined,
    color: dbEvent.color || undefined,
    eventDate: dbEvent.event_date,
  };
}

/**
 * 将前端事项转换为数据库插入类型
 */
function timelineEventToDbInsert(event: Omit<TimelineEvent, 'id'>): Omit<DbTimelineEventInsert, 'id'> {
  return {
    title: event.title,
    start_time: event.startTime,
    end_time: event.endTime,
    content: event.content,
    notes: event.notes || null,
    color: event.color || null,
    event_date: event.eventDate,
  };
}

export function useTimelineEvents(selectedDate?: Date) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  /**
   * 从数据库加载指定日期的事项
   */
  const loadEvents = useCallback(async (date?: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('timeline_events')
        .select('*');

      // 如果指定了日期，则只查询该日期的事项
      if (date) {
        const dateStr = formatDate(date);
        query = query.eq('event_date', dateStr);
      }

      query = query.order('start_time', { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const timelineEvents = (data || []).map(dbEventToTimelineEvent);
      setEvents(timelineEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载和实时订阅
  useEffect(() => {
    // 初始加载
    loadEvents(selectedDate);

    // 设置实时订阅
    const dateStr = selectedDate ? formatDate(selectedDate) : null;
    
    const channel = supabase
      .channel('timeline_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_events',
        },
        (payload) => {
          // 只处理当前选中日期的事项
          const eventDate = (payload.new as DbTimelineEvent)?.event_date || 
                           (payload.old as DbTimelineEvent)?.event_date;
          
          if (dateStr && eventDate !== dateStr) {
            return; // 忽略其他日期的事项
          }

          if (payload.eventType === 'INSERT') {
            const newEvent = dbEventToTimelineEvent(payload.new as DbTimelineEvent);
            if (!dateStr || newEvent.eventDate === dateStr) {
              setEvents((prev) => [...prev, newEvent].sort((a, b) => 
                a.startTime.localeCompare(b.startTime)
              ));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = dbEventToTimelineEvent(payload.new as DbTimelineEvent);
            setEvents((prev) =>
              prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setEvents((prev) => prev.filter((event) => event.id !== deletedId));
          }
        }
      )
      .subscribe();

    // 清理订阅
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEvents, selectedDate]);

  /**
   * 添加新事项
   */
  const addEvent = useCallback(async (event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> => {
    try {
      const dbEvent = timelineEventToDbInsert(event);
      
      const { data, error: insertError } = await supabase
        .from('timeline_events')
        .insert(dbEvent)
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('No data returned from insert');

      return dbEventToTimelineEvent(data);
    } catch (err) {
      console.error('Failed to add event:', err);
      throw err;
    }
  }, []);

  /**
   * 更新事项
   */
  const updateEvent = useCallback(async (id: string, updates: Partial<TimelineEvent>): Promise<void> => {
    try {
      const dbUpdates: Partial<DbTimelineEventInsert> = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
      if (updates.color !== undefined) dbUpdates.color = updates.color || null;

      const { error: updateError } = await supabase
        .from('timeline_events')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Failed to update event:', err);
      throw err;
    }
  }, []);

  /**
   * 删除事项
   */
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Failed to delete event:', err);
      throw err;
    }
  }, []);

  /**
   * 根据ID获取事项
   */
  const getEventById = useCallback((id: string): TimelineEvent | undefined => {
    return events.find((event) => event.id === id);
  }, [events]);

  /**
   * 清空所有事项
   */
  const clearAllEvents = useCallback(async (): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('timeline_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Failed to clear all events:', err);
      throw err;
    }
  }, []);

  return {
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    clearAllEvents,
    refreshEvents: loadEvents,
  };
}
