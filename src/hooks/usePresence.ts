import { useEffect } from 'react';
import api from '@/api/axiosInstance';
import { updatePresence, onPresenceChanged, offPresenceChanged } from '@/socket/socket';
import type { PresenceChangedPayload } from '@/types/socket';
import type { Room, PresenceStatus } from '@/types/chat';

export function usePresence(setRooms: React.Dispatch<React.SetStateAction<Room[]>>) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // presence.status는 연결 여부로 자동 갱신되니, 복원 기준은 프로필에서 명시적으로 고른 manualStatus를 쓴다
      let manualStatus: PresenceStatus | undefined;
      try {
        const res = await api.get('/api/users/me');
        manualStatus = res.data?.presence?.manualStatus;
      } catch (error) {
        console.error('저장된 presence 조회 실패:', error);
      }
      if (cancelled) return;

      const nextStatus: PresenceStatus =
        manualStatus === 'busy' || manualStatus === 'away' || manualStatus === 'offline'
          ? manualStatus
          : document.visibilityState === 'visible'
            ? 'online'
            : 'away';

      updatePresence(nextStatus, (response) => {
        if (!response.success) {
          console.error('presence 업데이트 실패:', response.message);
        }
      });
    })();

    const handleVisibilityChange = () => {
      updatePresence(document.visibilityState === 'visible' ? 'online' : 'away');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 상대방 상태 수신: 해당 유저가 상대방인 방들의 presence를 갱신
  useEffect(() => {
    const handlePresenceChanged = (payload: PresenceChangedPayload) => {
      setRooms((prev) =>
        prev.map((room) => (room.otherUserId === payload.userId ? { ...room, presence: payload.status } : room)),
      );
    };

    onPresenceChanged(handlePresenceChanged);
    return () => offPresenceChanged(handlePresenceChanged);
  }, [setRooms]);
}
