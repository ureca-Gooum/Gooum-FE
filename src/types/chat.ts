export type PresenceStatus = 'online' | 'away' | 'offline';

export interface Room {
  id: string;
  userName: string; // 상대방 이름
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isFavorite: boolean;
  presence: PresenceStatus;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  time: string;
  isMine: boolean;
}
