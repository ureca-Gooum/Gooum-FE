import { useState, useEffect } from 'react';
import { fetchNotifications } from '@/api/notifications';
import { fetchRooms } from '@/api/rooms';
import { onNewNotification, offNewNotification, connectSocket } from '@/socket/socket';
import type { NewNotificationPayload } from '@/types/socket';

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
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // 소켓 연결을 여기서도 보장하여 전역적으로 알림을 받을 수 있게 함
    connectSocket();

    fetchCounts();

    // Fetch on window focus
    const handleFocus = () => fetchCounts();
    const handleForceRefresh = () => fetchCounts();

    // 실시간 웹소켓 이벤트 수신 시 뱃지 즉시 업데이트 (API 폴링 대기시간 없앰)
    const handleNewNotification = (payload: NewNotificationPayload) => {
      setUnreadNotiCount((prev) => prev + 1);
      
      // 채팅 메시지 알림인 경우 DM 뱃지도 즉시 증가
      if (payload.type === 'message') {
        setUnreadDMCount((prev) => prev + 1);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('refreshUnreadBadge', handleForceRefresh);
    onNewNotification(handleNewNotification);

    // Fetch periodically (e.g., every 30 seconds)
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('refreshUnreadBadge', handleForceRefresh);
      offNewNotification(handleNewNotification);
      clearInterval(interval);
    };
  }, []);

  return {
    unreadNotiCount,
    unreadDMCount,
    refreshCounts: fetchCounts,
  };
}
