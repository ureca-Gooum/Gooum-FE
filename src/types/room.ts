export type RoomType = 'direct' | 'group';
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface Presence {
  status: PresenceStatus;
  lastSeenAt?: string | null;
}

export interface RoomMember {
  userId: string;
  name: string;
  profileImageUrl: string | null;
  presence?: Presence;
  /** 멘션 호버카드에 보여줄 상태 메시지 (없으면 카드에서 해당 영역을 생략) */
  statusMessage?: string;
}

export interface LastMessage {
  content?: string;
  sentAt?: string;
}

// 생성/목록/상세 조회 공통으로 쓰는 응답 형태
export interface RoomApiResponse {
  roomId: string;
  type: RoomType;
  name: string | null;
  members: RoomMember[];
  memberCount: number;
  createdBy?: string;
  lastMessage: Record<string, never> | LastMessage;
  unreadCount: number;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// "내 채팅방 목록 조회" 전용 응답 (rooms 배열 + total)
export interface RoomListApiResponse {
  rooms: RoomApiResponse[];
  total: number;
}
