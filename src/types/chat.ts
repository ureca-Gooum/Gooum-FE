export type PresenceStatus = 'online' | 'away' | 'offline';

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TiptapNode {
  type: string;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
  attrs?: Record<string, any>;
}

export interface TiptapDoc {
  type: string; // 보통 "doc"
  content: TiptapNode[];
}

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
  content: TiptapDoc;
  time: string;
  isMine: boolean;
}
