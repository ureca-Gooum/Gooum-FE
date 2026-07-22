// src/socket/socket.ts
import { io, Socket } from 'socket.io-client';
import type { SendMessagePayload, NewMessagePayload } from '@/types/socket';

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
