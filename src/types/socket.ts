import type { TiptapDoc } from '@/types/chat';

interface BaseSendMessagePayload {
  roomId: string;
}

interface TextMessagePayload extends BaseSendMessagePayload {
  type: 'text';
  content: TiptapDoc;
}

interface ImageMessagePayload extends BaseSendMessagePayload {
  type: 'image';
  fileUrl: string;
  fileName: string;
}

interface FileMessagePayload extends BaseSendMessagePayload {
  type: 'file';
  fileUrl: string;
  fileName: string;
}

export type SendMessagePayload = TextMessagePayload | ImageMessagePayload | FileMessagePayload;

export interface NewMessagePayload {
  messageId: string;
  roomId: string;
  sender: {
    userId: string;
    name: string;
    profileImageUrl: string | null;
  };
  content: TiptapDoc;
  type: 'text' | 'image' | 'file';
  fileUrl: string | null;
  fileName: string | null;
  documentId: string | null;
  createdAt: string;
}
