import { useState } from 'react';
import { updateRoomNotificationSettings } from '@/api/rooms';

const STORAGE_KEY = 'mutedRoomIds';

/**
 * 채팅방 알림 켜기/끄기 상태. localStorage 기반이라 어느 페이지(채팅 페이지, 알림 페이지 등)에서
 * 호출해도 항상 같은 값을 공유한다.
 */
export function useMutedRooms() {
  const [mutedRoomIds, setMutedRoomIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as string[];
    } catch {
      return [];
    }
  });

  const toggleMute = async (roomId: string) => {
    const currentlyMuted = mutedRoomIds.includes(roomId);
    const willBeMuted = !currentlyMuted;

    // Optimistic Update
    setMutedRoomIds((prev) => {
      const next = willBeMuted ? [...prev, roomId] : prev.filter((id) => id !== roomId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    try {
      // 알림을 끄는 것(willBeMuted)이면 수신 안 함(false), 켜는 것이면 수신 함(true)
      await updateRoomNotificationSettings(roomId, {
        message: !willBeMuted,
        mention: !willBeMuted,
      });
    } catch (error) {
      // 실패 시 원래 상태로 롤백
      setMutedRoomIds((prev) => {
        const next = currentlyMuted ? [...prev, roomId] : prev.filter((id) => id !== roomId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      console.error('알림 설정 변경 실패:', error);
      alert('알림 설정 변경에 실패했어요.');
    }
  };

  const isMuted = (roomId: string) => mutedRoomIds.includes(roomId);

  return { mutedRoomIds, isMuted, toggleMute };
}
