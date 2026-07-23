import type { MessageApiResponse } from '@/types/message';
import type { Message, TiptapDoc } from '@/types/chat';
import { getCurrentUserId } from '@/constants/auth';

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${period} ${displayHour}:${minutes}`;
}

function getDeletedContent(): TiptapDoc {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: '삭제된 메시지입니다.' }] }],
  };
}

export function mapMessageFromApi(apiData: MessageApiResponse): Message {
  const currentUserId = getCurrentUserId();

  return {
    id: apiData.messageId,
    roomId: apiData.roomId,
    senderId: apiData.sender.userId,
    senderName: apiData.sender.name,
    content: apiData.isDeleted ? getDeletedContent() : (apiData.content ?? null),
    type: apiData.type === 'image' || apiData.type === 'file' ? apiData.type : 'text',
    fileUrl: apiData.fileUrl,
    fileName: apiData.fileName,
    time: formatTime(apiData.createdAt),
    isMine: apiData.sender.userId === currentUserId,
    isDeleted: apiData.isDeleted,
  };
}
