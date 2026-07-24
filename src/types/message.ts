import type { TiptapDoc } from '@/types/chat';

export type MessageType = 'text' | 'image' | 'file' | 'document' | 'ai_summary';

export interface MessageSender {
  userId: string;
  name: string;
  profileImageUrl: string | null;
}

export interface MessageApiResponse {
  messageId: string;
  roomId: string;
  sender: MessageSender;
  content: TiptapDoc | null;
  type: MessageType;
  fileUrl: string | null;
  fileName: string | null;
  documentId: string | null;
  isDeleted: boolean;
  createdAt: string;
}

export interface MessageListApiResponse {
  messages: MessageApiResponse[];
  hasMore: boolean;
  nextCursor: string | null;
}
