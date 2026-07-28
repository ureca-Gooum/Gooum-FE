export interface NotificationItem {
  id: string;
  type: 'message' | 'mention' | 'document' | 'system' | 'file';
  title: string;
  content: string;
  time: string;
  /** 서버가 내려주는 원본 ISO 타임스탬프. 날짜별 그룹핑(오늘/어제/N월 N일)에 쓴다. */
  createdAt: string;
  isRead: boolean;
  avatarUrl?: string; // 발송자 프로필 또는 아이콘
  roomId?: string;
  messageId?: string;
}
