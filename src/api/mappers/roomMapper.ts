import type { RoomApiResponse, RoomMember } from '@/types/room';
import type { Room } from '@/types/chat';

const CURRENT_USER_ID = 'me-user-id';

function getOtherMember(members: RoomMember[]): RoomMember | undefined {
  const filtered = members.filter((m) => m.userId !== CURRENT_USER_ID);
  return filtered[0] ?? members[0];
}

function formatLastMessageTime(sentAt?: string): string {
  if (!sentAt) return '';
  const date = new Date(sentAt);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${period} ${displayHour}:${minutes}`;
}

export function mapRoomFromApi(apiData: RoomApiResponse): Room {
  const isDirect = apiData.type === 'direct';
  const otherMember = isDirect ? getOtherMember(apiData.members) : undefined;
  const lastMessage = apiData.lastMessage as { content?: string; sentAt?: string };

  return {
    id: apiData.roomId,
    type: apiData.type,
    displayName: isDirect ? (otherMember?.name ?? '알 수 없음') : (apiData.name ?? '그룹 채팅'),
    displayImage: isDirect ? (otherMember?.profileImageUrl ?? null) : null,
    presence: isDirect ? (otherMember?.presence?.status ?? 'offline') : 'offline',
    memberCount: apiData.memberCount,
    lastMessagePreview: lastMessage?.content ?? '아직 메시지가 없어요',
    lastMessageTime: formatLastMessageTime(lastMessage?.sentAt),
    unreadCount: apiData.unreadCount,
    isFavorite: apiData.isFavorite,
  };
}
