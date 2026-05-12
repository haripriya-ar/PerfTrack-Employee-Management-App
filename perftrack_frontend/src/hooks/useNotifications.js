import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/');
      setNotifications(data.results || data);
    } catch {
      // Ignore
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count/');
      setUnreadCount(data.unread_count);
    } catch {
      // Ignore
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications };
}
