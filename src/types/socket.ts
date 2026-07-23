import type { TiptapDoc, PresenceStatus } from '@/types/chat';

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

export interface TypingPayload {
  roomId: string;
}

export interface UserTypingPayload {
  roomId: string;
  userId: string;
  name: string;
}

export interface UpdatePresencePayload {
  status: PresenceStatus;
}

export interface UpdatePresenceResponse {
  success: boolean;
  message?: string;
}

export interface PresenceChangedPayload {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string;
}

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

export interface NewNotificationPayload {
  notificationId: string;
  type: string;
  title: string;
  body: string;
  roomId: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageDeletedPayload {
  messageId: string;
  roomId: string;
}
