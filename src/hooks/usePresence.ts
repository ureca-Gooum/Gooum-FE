import { useEffect } from 'react';
import { updatePresence, onPresenceChanged, offPresenceChanged } from '@/socket/socket';
import type { PresenceChangedPayload } from '@/types/socket';
import type { Room } from '@/types/chat';

/**
 * 탭 가시성에 따라 내 상태를 online/away로 전송하고,
 * 서버로부터 오는 presenceChanged를 받아 rooms 목록의 presence를 갱신한다.
 *
 * roomId 매칭은 Room.otherUserId(1:1 채팅 상대방 userId) 기준.
 * 그룹채팅은 대상이 여러 명이라 헤더 표시 대상이 모호하므로 갱신 대상에서 제외한다.
 */
export function usePresence(setRooms: React.Dispatch<React.SetStateAction<Room[]>>) {
  // 내 상태 전송: 최초 online, 탭 벗어나면 away, 창 닫을 때 offline(베스트 에포트)
  useEffect(() => {
    updatePresence('online', (response) => {
      if (!response.success) {
        console.error('presence 업데이트 실패:', response.message);
      }
    });

    const handleVisibilityChange = () => {
      updatePresence(document.visibilityState === 'visible' ? 'online' : 'away');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
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
