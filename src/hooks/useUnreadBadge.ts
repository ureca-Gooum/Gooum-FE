import { useState, useEffect } from 'react';
import { fetchNotifications } from '@/api/notifications';
import { fetchRooms } from '@/api/rooms';
import { onUnreadCount, offUnreadCount, connectSocket } from '@/socket/socket';
import type { UnreadCountPayload } from '@/types/socket';

export function useUnreadBadge() {
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);
  const [unreadDMCount, setUnreadDMCount] = useState(0);

  // 소켓 연결 전 잠깐의 공백을 메우는 최초 1회용 REST 폴백 (이후엔 unreadCount 소켓 이벤트가 갱신)
  const fetchCounts = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const [notiRes, roomsRes] = await Promise.all([
        fetchNotifications(1), // Just to get the unreadCount
        fetchRooms(),
      ]);

      setUnreadNotiCount(notiRes.unreadCount || 0);

      const unreadRoomCount = roomsRes?.rooms?.filter((room) => (room.unreadCount || 0) > 0).length || 0;
      setUnreadDMCount(unreadRoomCount);
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

    // 서버가 연결 시점 + 상태 변화마다 다시 보내주는 권위 있는 값을 그대로 반영
    const handleUnreadCount = (payload: UnreadCountPayload) => {
      setUnreadNotiCount(payload.notifications);
      setUnreadDMCount(payload.rooms);
    };

    onUnreadCount(handleUnreadCount);

    return () => {
      offUnreadCount(handleUnreadCount);
    };
  }, []);

  return {
    unreadNotiCount,
    unreadDMCount,
    refreshCounts: fetchCounts,
  };
}
