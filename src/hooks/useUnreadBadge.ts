import { useState, useEffect } from 'react';
import { fetchNotifications } from '@/api/notifications';
import { fetchRooms } from '@/api/rooms';

export const triggerBadgeRefresh = () => {
  window.dispatchEvent(new Event('refreshUnreadBadge'));
};

export function useUnreadBadge() {
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);
  const [unreadDMCount, setUnreadDMCount] = useState(0);

  const fetchCounts = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const [notiRes, roomsRes] = await Promise.all([
        fetchNotifications(1), // Just to get the unreadCount
        fetchRooms()
      ]);

      setUnreadNotiCount(notiRes.unreadCount || 0);

      const totalUnreadDMs = roomsRes?.rooms?.reduce((acc, room) => acc + (room.unreadCount || 0), 0) || 0;
      setUnreadDMCount(totalUnreadDMs);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Fetch on window focus
    const handleFocus = () => fetchCounts();
    const handleForceRefresh = () => fetchCounts();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('refreshUnreadBadge', handleForceRefresh);

    // Fetch periodically (e.g., every 30 seconds)
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('refreshUnreadBadge', handleForceRefresh);
      clearInterval(interval);
    };
  }, []);

  return {
    unreadNotiCount,
    unreadDMCount,
    refreshCounts: fetchCounts,
  };
}
