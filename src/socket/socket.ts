import { io, Socket } from 'socket.io-client';
import type { MessageDeletedPayload } from '@/types/socket';

export function onMessageDeleted(handler: (payload: MessageDeletedPayload) => void) {
  socket?.on('messageDeleted', handler);
}

export function offMessageDeleted(handler: (payload: MessageDeletedPayload) => void) {
  socket?.off('messageDeleted', handler);
}

import type {
  SendMessagePayload,
  NewMessagePayload,
  UserTypingPayload,
  UpdatePresencePayload,
  UpdatePresenceResponse,
  PresenceChangedPayload,
  NewNotificationPayload,
} from '@/types/socket';
import type { PresenceStatus } from '@/types/chat';

let socket: Socket | null = null;

// 1. 소켓 연결 (토큰 인증 포함) - 중복 연결 방지
export function connectSocket(): Socket {
  if (socket?.connected) {
    console.log('이미 연결된 소켓 재사용:', socket.id);
    return socket;
  }

  const token = localStorage.getItem('accessToken');

  socket = io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
  });

  socket.on('connect_error', (err) => {
    console.error('소켓 연결 실패:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('소켓 연결 끊김:', reason);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// 2. 채팅방 입장
export function joinRoom(roomId: string, callback?: (response: any) => void) {
  const s = getSocket();
  console.log('joinRoom 호출, 소켓 연결 상태:', s?.connected, '/ socketId:', s?.id);
  s?.emit('joinRoom', { roomId }, callback);
}

// 3. 채팅방 화면 이탈
export function leaveRoom(roomId: string, callback?: (response: any) => void) {
  socket?.emit('leaveRoom', { roomId }, callback);
}

// 4. 메시지 전송
export function sendMessage(payload: SendMessagePayload, callback?: (response: any) => void) {
  socket?.emit('sendMessage', payload, callback);
}

// 5. 새 메시지 수신 - 리스너 등록
export function onNewMessage(handler: (payload: NewMessagePayload) => void) {
  socket?.on('newMessage', handler);
}

export function offNewMessage(handler: (payload: NewMessagePayload) => void) {
  socket?.off('newMessage', handler);
}

// 6. 타이핑 중 알림 전송
export function emitTyping(roomId: string, callback?: (response: any) => void) {
  socket?.emit('typing', { roomId }, callback);
}

// 7. 상대방 타이핑 알림 수신 - 리스너 등록
export function onUserTyping(handler: (payload: UserTypingPayload) => void) {
  socket?.on('userTyping', handler);
}

export function offUserTyping(handler: (payload: UserTypingPayload) => void) {
  socket?.off('userTyping', handler);
}

// 8. 내 온라인 상태 변경 전송
export function updatePresence(status: PresenceStatus, callback?: (response: UpdatePresenceResponse) => void) {
  const payload: UpdatePresencePayload = { status };
  socket?.emit('updatePresence', payload, callback);
}

// 9. 상대방 온라인 상태 변경 수신 - 리스너 등록
export function onPresenceChanged(handler: (payload: PresenceChangedPayload) => void) {
  socket?.on('presenceChanged', handler);
}

export function offPresenceChanged(handler: (payload: PresenceChangedPayload) => void) {
  socket?.off('presenceChanged', handler);
}

// 10. 실시간 알림 수신 - 지금 보고 있지 않은 방 포함, 내가 속한 모든 방에 대해 온다
export function onNewNotification(handler: (payload: NewNotificationPayload) => void) {
  socket?.on('newNotification', handler);
}

export function offNewNotification(handler: (payload: NewNotificationPayload) => void) {
  socket?.off('newNotification', handler);
}
