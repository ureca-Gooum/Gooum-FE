export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

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
  content: TiptapDoc | null;
  type: 'text' | 'image' | 'file';
  fileUrl: string | null;
  fileName: string | null;
  time: string;
  isMine: boolean;
  isDeleted: boolean;
}
