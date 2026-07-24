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

// 채팅에 "문서 카드"를 올릴 때 사용. 일반 문서 생성 카드
interface DocumentMessagePayload extends BaseSendMessagePayload {
  type: 'document';
  content: TiptapDoc;
}

// AI 회의록 생성 카드 - 위와 페이로드 모양은 같지만 백엔드/프론트에서
// "문서"와 "AI 회의록"을 구분해서 표시하기 위해 타입을 분리한다
interface AiSummaryMessagePayload extends BaseSendMessagePayload {
  type: 'ai_summary';
  content: TiptapDoc;
}

export type SendMessagePayload =
  | TextMessagePayload
  | ImageMessagePayload
  | FileMessagePayload
  | DocumentMessagePayload
  | AiSummaryMessagePayload;

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
  type: 'text' | 'image' | 'file' | 'document' | 'ai_summary';
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
