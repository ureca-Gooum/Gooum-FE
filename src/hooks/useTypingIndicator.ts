import { useEffect, useRef, useState } from 'react';
import { emitTyping, onUserTyping, offUserTyping } from '@/socket/socket';
import type { UserTypingPayload } from '@/types/socket';

// stopTyping 이벤트가 서버에 없으므로, 마지막 수신 후 일정 시간 지나면 자동으로 지운다.
const TYPING_EXPIRE_MS = 3000;
// 매 키 입력마다 emit하지 않고, 최소 이 간격마다 한 번만 서버로 전송한다.
const EMIT_THROTTLE_MS = 2000;

interface TypingUser {
  userId: string;
  name: string;
}

export function useTypingIndicator(roomId: string | null) {
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastEmitAtRef = useRef(0);

  // 방을 옮기면 이전 방의 타이핑 상태/타이머를 정리한다.
  useEffect(() => {
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};
    setTypingUsers({});
  }, [roomId]);

  useEffect(() => {
    const handleUserTyping = (payload: UserTypingPayload) => {
      if (payload.roomId !== roomId) return;

      setTypingUsers((prev) => ({
        ...prev,
        [payload.userId]: { userId: payload.userId, name: payload.name },
      }));

      const prevTimeout = timeoutsRef.current[payload.userId];
      if (prevTimeout) clearTimeout(prevTimeout);

      timeoutsRef.current[payload.userId] = setTimeout(() => {
        setTypingUsers((prev) => {
          if (!(payload.userId in prev)) return prev;
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        });
        delete timeoutsRef.current[payload.userId];
      }, TYPING_EXPIRE_MS);
    };

    onUserTyping(handleUserTyping);
    return () => offUserTyping(handleUserTyping);
  }, [roomId]);

  // 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const notifyTyping = () => {
    if (!roomId) return;
    const now = Date.now();
    if (now - lastEmitAtRef.current < EMIT_THROTTLE_MS) return;
    lastEmitAtRef.current = now;
    emitTyping(roomId);
  };

  const typingUserList = Object.values(typingUsers);
  const typingLabel =
    typingUserList.length === 0
      ? null
      : typingUserList.length === 1
        ? `${typingUserList[0].name}님이 입력 중입니다`
        : `${typingUserList[0].name}님 외 ${typingUserList.length - 1}명이 입력 중입니다`;

  return { typingLabel, notifyTyping };
}
