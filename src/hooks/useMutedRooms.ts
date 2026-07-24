import { useState } from 'react';

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

  const toggleMute = (roomId: string) => {
    setMutedRoomIds((prev) => {
      const isMuted = prev.includes(roomId);
      const next = isMuted ? prev.filter((id) => id !== roomId) : [...prev, roomId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isMuted = (roomId: string) => mutedRoomIds.includes(roomId);

  return { mutedRoomIds, isMuted, toggleMute };
}
