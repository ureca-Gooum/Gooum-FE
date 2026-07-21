export type RoomType = 'direct' | 'group';

export interface RoomMember {
  userId: string;
  name: string;
  profileImageUrl: string | null;
}

export interface RoomApiResponse {
  roomId: string;
  type: RoomType;
  name: string | null;
  members: RoomMember[];
  createdBy: string;
  lastMessage: Record<string, never> | { content?: string; sentAt?: string };
  createdAt: string;
  updatedAt: string;
}
