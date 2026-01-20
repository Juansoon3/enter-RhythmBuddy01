// 时间轴事项管理Hook

import { useState, useEffect, useCallback } from 'react';
import { TimelineEvent } from '@/pages/timeline/types';

const STORAGE_KEY = 'timeline-events';

/**
 * 从localStorage加载事项
 */
function loadEventsFromStorage(): TimelineEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load events from storage:', error);
    return [];
  }
}

/**
 * 保存事项到localStorage
 */
function saveEventsToStorage(events: TimelineEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save events to storage:', error);
  }
}

export function useTimelineEvents() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始加载
  useEffect(() => {
    const loaded = loadEventsFromStorage();
    setEvents(loaded);
    setIsLoading(false);
  }, []);

  // 自动保存
  useEffect(() => {
    if (!isLoading) {
      saveEventsToStorage(events);
    }
  }, [events, isLoading]);

  /**
   * 添加新事项
   */
  const addEvent = useCallback((event: Omit<TimelineEvent, 'id'>): TimelineEvent => {
    const newEvent: TimelineEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  /**
   * 更新事项
   */
  const updateEvent = useCallback((id: string, updates: Partial<TimelineEvent>): void => {
    setEvents(prev =>
      prev.map(event =>
        event.id === id ? { ...event, ...updates } : event
      )
    );
  }, []);

  /**
   * 删除事项
   */
  const deleteEvent = useCallback((id: string): void => {
    setEvents(prev => prev.filter(event => event.id !== id));
  }, []);

  /**
   * 根据ID获取事项
   */
  const getEventById = useCallback((id: string): TimelineEvent | undefined => {
    return events.find(event => event.id === id);
  }, [events]);

  /**
   * 清空所有事项
   */
  const clearAllEvents = useCallback((): void => {
    setEvents([]);
  }, []);

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    clearAllEvents,
  };
}
