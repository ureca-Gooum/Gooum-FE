import type { Message } from '@/types/chat';

export const dummyMessages: Message[] = [
  {
    id: 'm1',
    roomId: '1',
    senderId: 'u1',
    senderName: 'Daichi Fukuda',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Cupcake ipsum dolor sit amet muffin sesame snaps caramels.' }],
        },
      ],
    },
    time: '오전 9:15',
    isMine: false,
  },
  {
    id: 'm2',
    roomId: '1',
    senderId: 'me',
    senderName: '박소연',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'I will push Krystal to give us a few more days. ' },
            { type: 'text', text: '이건 볼드 테스트', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    },
    time: '오전 9:15',
    isMine: true,
  },
  {
    id: 'm3',
    roomId: '1',
    senderId: 'u1',
    senderName: 'Daichi Fukuda',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Pastry apple pie halvah cheesecake candy tiramisu cake.' }],
        },
      ],
    },
    time: '오전 9:16',
    isMine: false,
  },
];
