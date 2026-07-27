import type { PresenceStatus } from '@/types/chat';

export interface SearchUser {
  userId: string;
  name: string;
  profileImageUrl: string | null;
  presence?: {
    status: PresenceStatus;
  };
}

export interface SearchRoom {
  roomId: string;
  type: 'group' | 'direct';
  name: string | null;
  memberCount: number;
}

export interface SearchMessage {
  messageId: string;
  roomId: string;
  roomName: string | null;
  sender: {
    userId: string;
    name: string;
  };
  content: string;
  createdAt: string;
}

export interface SearchDocument {
  documentId: string;
  title: string;
  roomId: string;
  roomName: string | null;
  createdAt: string;
}

export interface SearchApiResponse {
  users: SearchUser[];
  rooms: SearchRoom[];
  messages: SearchMessage[];
  documents: SearchDocument[];
}
