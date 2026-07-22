import { io, Socket } from 'socket.io-client';
import type { SendMessagePayload, NewMessagePayload } from '@/types/socket';

let socket: Socket | null = null;

// 1. 소켓 연결 (토큰 인증 포함)
export function connectSocket(): Socket {
  const token = localStorage.getItem('accessToken');

  socket = io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
  });

  socket.on('connect_error', (err) => {
    console.error('소켓 연결 실패:', err.message);
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
  socket?.emit('joinRoom', { roomId }, callback);
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
