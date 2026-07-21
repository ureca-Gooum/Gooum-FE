import type { Room } from '@/types/chat';

export const dummyRooms: Room[] = [
  {
    id: '1',
    userName: 'Daichi Fukuda',
    lastMessage: '내일 회의 몇 시였죠?',
    lastMessageTime: '1:47 PM',
    presence: 'online',
    unreadCount: 2,
    isFavorite: true,
  },
  {
    id: '2',
    userName: '김민지',
    lastMessage: '자료 확인했습니다!',
    lastMessageTime: '11:20 AM',
    presence: 'away',
    unreadCount: 0,
    isFavorite: true,
  },
  {
    id: '3',
    userName: 'Amanda Brady',
    lastMessage: 'Cupcake ipsum dolor sit amet',
    lastMessageTime: '어제',
    presence: 'online',
    unreadCount: 5,
    isFavorite: false,
  },
  {
    id: '4',
    userName: '박서준',
    lastMessage: '넵 알겠습니다~',
    lastMessageTime: '화요일',
    presence: 'offline',
    unreadCount: 0,
    isFavorite: false,
  },
];
