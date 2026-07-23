import { useState } from 'react';
import { MessageCircle, FileText, Sparkles } from 'lucide-react';
import { ListPanel } from '@/components/layout/ListPanel';
import { MainPanel } from '@/components/layout/MainPanel';
import { NotificationListItem } from '@/components/NotificationListItem';
import { DateDivider } from '@/components/DateDivider';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import type { NotificationItem } from '@/types/notification';
import type { Message, TiptapDoc } from '@/types/chat';

// 더미 텍스트 데이터
const dummyText1 =
  'Cupcake ipsum dolor sit amet muffin sesame snaps caramels. Gingerbread chupa chups cupcake tiramisu croissant. Pastry apple pie halvah cheesecake candy tiramisu cake.';
const dummyText2 = "I will push Krystal to give us a few more days. That shouldn't be a problem.";

const createDummyDoc = (text: string): TiptapDoc => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'message', // DM 탭
    title: 'Daichi Fukuda',
    content: dummyText1,
    time: '어제',
    isRead: false,
  },
  {
    id: '2',
    type: 'message', // DM 탭
    title: 'Park Soyeon',
    content: dummyText2,
    time: '어제',
    isRead: false,
  },
  {
    id: '3',
    type: 'document', // 문서 탭
    title: '디자인 시스템',
    content: '기획서 문서가 업데이트 되었습니다. 확인 부탁드립니다.',
    time: '어제',
    isRead: false,
  },
];

const DUMMY_MESSAGES: Message[] = [
  {
    id: 'm1',
    roomId: 'r1',
    senderId: 'u1',
    senderName: 'Daichi Fukuda',
    content: createDummyDoc(dummyText1),
    time: '5/12, 9:15 AM',
    isMine: false,
    isDeleted: false,
  },
  {
    id: 'm2',
    roomId: 'r1',
    senderId: 'me',
    senderName: '나',
    content: createDummyDoc(dummyText1),
    time: '5/12, 9:15 AM',
    isMine: true,
    isDeleted: false,
  },
  {
    id: 'm3',
    roomId: 'r1',
    senderId: 'u1',
    senderName: 'Daichi Fukuda',
    content: createDummyDoc(dummyText2),
    time: '5/12, 9:16 AM',
    isMine: false,
    isDeleted: false,
  },
];

export const NotificationsPage = () => {
  const [notifications] = useState<NotificationItem[]>(DUMMY_NOTIFICATIONS);
  const [selectedNotiId, setSelectedNotiId] = useState<string | null>('1');
  const [activeTab, setActiveTab] = useState<'전체' | 'DM' | '문서'>('전체');
  const [activeMainTab, setActiveMainTab] = useState<'채팅' | '파일' | 'AI 회의록'>('채팅');

  // 좌측 탭 필터링 로직
  const filteredNotifications = notifications.filter((noti) => {
    if (activeTab === '전체') return true;
    if (activeTab === 'DM') return noti.type === 'message' || noti.type === 'mention';
    if (activeTab === '문서') return noti.type === 'document';
    return true;
  });

  // 현재 선택된 알림 정보 찾기: 빌드 에러나서 잠시 주석처리 해뒀으니 사용 시 풀고 작업해 주세요!
  // const handleMarkAllAsRead = () => {
  //   setNotifications((prev) => prev.map((noti) => ({ ...noti, isRead: true })));
  // };

  const isLoggedIn = !!localStorage.getItem('accessToken');
  if (!isLoggedIn) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg-canvas">
        <div className="text-sm text-fg-tertiary">로그인 후 이용 가능합니다.</div>
      </div>
    );
  }

  const selectedNoti = notifications.find((n) => n.id === selectedNotiId) || notifications[0];

  return (
    <div className="flex flex-1">
      <ListPanel
        header={
          <div className="flex flex-col gap-4">
            <h2 className="text-[20px] font-bold text-fg-primary">내 활동</h2>
            <div className="flex gap-5 -mb-4 border-b border-border-default pb-0">
              <button
                onClick={() => setActiveTab('전체')}
                className={`pb-3 text-[13px] font-bold transition-colors ${
                  activeTab === '전체'
                    ? 'border-b-[3px] border-fg-primary text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                전체
              </button>
              <button
                onClick={() => setActiveTab('DM')}
                className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${
                  activeTab === 'DM'
                    ? 'border-b-[3px] border-fg-primary text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <MessageCircle size={15} />
                DM
              </button>
              <button
                onClick={() => setActiveTab('문서')}
                className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${
                  activeTab === '문서'
                    ? 'border-b-[3px] border-fg-primary text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <FileText size={15} />
                문서
              </button>
            </div>
          </div>
        }>
        <div className="flex flex-col h-full overflow-y-auto px-2 py-2">
          {filteredNotifications.length > 0 ? (
            <>
              <DateDivider label="어제" />
              <div className="flex flex-col gap-2">
                {filteredNotifications.map((noti) => (
                  <NotificationListItem
                    key={noti.id}
                    notification={noti}
                    isSelected={selectedNotiId === noti.id}
                    onSelect={() => setSelectedNotiId(noti.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-tertiary mt-10">
              {activeTab} 내역이 없습니다.
            </div>
          )}
        </div>
      </ListPanel>

      <MainPanel
        header={
          <div className="flex h-[63px] items-center gap-3 border-b border-border-default px-5">
            <Avatar seed={selectedNoti.id} imageUrl={undefined} presence="online" alt={selectedNoti.title} size={32} />
            <h2 className="shrink-0 text-base font-bold text-fg-primary tracking-tight">{selectedNoti.title}</h2>

            <div className="flex items-center gap-5 ml-4">
              <button
                onClick={() => setActiveMainTab('채팅')}
                className={`relative text-[13px] transition-colors ${
                  activeMainTab === '채팅'
                    ? 'font-bold text-brand-primary'
                    : 'font-medium text-fg-tertiary hover:text-fg-primary'
                }`}>
                채팅
                {activeMainTab === '채팅' && (
                  <span
                    className="absolute left-0 right-0 bg-brand-primary"
                    style={{ bottom: '-21px', height: '2px' }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveMainTab('파일')}
                className={`relative text-[13px] transition-colors ${
                  activeMainTab === '파일'
                    ? 'font-bold text-brand-primary'
                    : 'font-medium text-fg-tertiary hover:text-fg-primary'
                }`}>
                파일
                {activeMainTab === '파일' && (
                  <span
                    className="absolute left-0 right-0 bg-brand-primary"
                    style={{ bottom: '-21px', height: '2px' }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveMainTab('AI 회의록')}
                className={`relative flex items-center gap-1 text-[13px] transition-colors ${
                  activeMainTab === 'AI 회의록'
                    ? 'font-bold text-brand-primary'
                    : 'font-medium text-fg-tertiary hover:text-fg-primary'
                }`}>
                <Sparkles size={14} />
                AI 회의록
                {activeMainTab === 'AI 회의록' && (
                  <span
                    className="absolute left-0 right-0 bg-brand-primary"
                    style={{ bottom: '-21px', height: '2px' }}
                  />
                )}
              </button>
            </div>
          </div>
        }>
        <div className="flex flex-col h-full overflow-y-auto px-6 py-4 gap-3 bg-bg-canvas">
          {activeMainTab === '채팅' && (
            <>
              {DUMMY_MESSAGES.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onDelete={() => {}} />
              ))}
            </>
          )}

          {activeMainTab === '파일' && (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-tertiary h-full min-h-[300px]">
              업로드된 파일이 없습니다.
            </div>
          )}

          {activeMainTab === 'AI 회의록' && (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-tertiary h-full min-h-[300px]">
              생성된 AI 회의록이 없습니다.
            </div>
          )}
        </div>
      </MainPanel>
    </div>
  );
};
