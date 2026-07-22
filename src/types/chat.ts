export type PresenceStatus = 'online' | 'away' | 'offline';

export interface Room {
  id: string;
  type: 'direct' | 'group';
  displayName: string;
  displayImage: string | null;
  presence: PresenceStatus;
  otherUserId: string | null;
  memberCount: number;
  lastMessagePreview: string;
  lastMessageTime: string;
  unreadCount: number;
  isFavorite: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string | Record<string, any>;
  time: string;
  isMine: boolean;
}
