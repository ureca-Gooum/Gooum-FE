export interface NotificationItem {
  id: string;
  type: 'message' | 'mention' | 'document' | 'system';
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  avatarUrl?: string; // 발송자 프로필 또는 아이콘
  roomId?: string;
}
