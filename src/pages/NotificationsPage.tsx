import { useEffect, useState } from 'react';
import { MessageCircle, FileText, AtSign } from 'lucide-react';
import { ListPanel } from '@/components/layout/ListPanel';
import { ChatRoomPanel } from '@/components/chat/ChatRoomPanel';
import { NotificationListItem } from '@/components/NotificationListItem';
import { DateDivider } from '@/components/DateDivider';
import { fetchRoomDetail, toggleFavorite } from '@/api/rooms';
import { mapRoomFromApi } from '@/api/mappers/roomMapper';
import { getCurrentUserId } from '@/constants/auth';
import { useRoomConversation } from '@/hooks/useRoomConversation';
import { useMutedRooms } from '@/hooks/useMutedRooms';
import type { NotificationItem } from '@/types/notification';
import type { Room } from '@/types/chat';

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'message', // DM 탭
    title: 'Daichi Fukuda',
    content:
      'Cupcake ipsum dolor sit amet muffin sesame snaps caramels. Gingerbread chupa chups cupcake tiramisu croissant.',
    time: '어제',
    isRead: false,
    roomId: 'r1', // TODO: 실제 알림 API 연동 시 서버가 내려주는 roomId로 교체
  },
  {
    id: '2',
    type: 'message', // DM 탭
    title: 'Park Soyeon',
    content: "I will push Krystal to give us a few more days. That shouldn't be a problem.",
    time: '어제',
    isRead: false,
    roomId: 'r2',
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

type NotificationMainTab = 'chat' | 'file' | 'aiMinutes';

export const NotificationsPage = () => {
  const currentUserId = getCurrentUserId();

  const [notifications] = useState<NotificationItem[]>(DUMMY_NOTIFICATIONS);
  const [selectedNotiId, setSelectedNotiId] = useState<string | null>('1');
  const [activeTab, setActiveTab] = useState<'전체' | 'DM' | '문서' | '멘션'>('전체');
  const [activeMainTab, setActiveMainTab] = useState<NotificationMainTab>('chat');

  // 알림에 연결된 채팅방 상세 (아바타/이름/즐겨찾기 등 헤더 표시용) - ChatPage의 rooms 리스트 대신
  // 선택된 알림 하나에 대해서만 fetchRoomDetail로 가져온다. mapRoomFromApi를 그대로 재사용해서
  // ChatPage와 동일한 Room 모양을 만든다.
  const [room, setRoom] = useState<Room | null>(null);

  const { mutedRoomIds, toggleMute } = useMutedRooms();

  const selectedNoti = notifications.find((n) => n.id === selectedNotiId) || notifications[0];
  const roomId = selectedNoti?.roomId ?? null;

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }
    let isMounted = true;
    fetchRoomDetail(roomId)
      .then((res) => {
        if (isMounted) setRoom(mapRoomFromApi(res));
      })
      .catch((err) => console.error('채팅방 정보를 불러오지 못했어요:', err));
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // ChatPage의 useRoomConversation과 완전히 동일한 훅. roomId만 다를 뿐 메시지/전송/타이핑/AI캡쳐선택 로직이 그대로 재사용된다.
  const conversation = useRoomConversation(roomId, currentUserId);

  const handleToggleFavorite = async () => {
    if (!room) return;
    const current = room.isFavorite;
    setRoom((prev) => (prev ? { ...prev, isFavorite: !current } : prev));
    try {
      await toggleFavorite(room.id, !current);
    } catch {
      setRoom((prev) => (prev ? { ...prev, isFavorite: current } : prev));
    }
  };

  // 좌측 탭 필터링 로직
  // '멘션' 탭이 새로 생기면서 DM은 message만, 멘션은 mention만 보여주도록 분리했다.
  const filteredNotifications = notifications.filter((noti) => {
    if (activeTab === '전체') return true;
    if (activeTab === 'DM') return noti.type === 'message';
    if (activeTab === '멘션') return noti.type === 'mention';
    if (activeTab === '문서') return noti.type === 'document';
    return true;
  });

  const isLoggedIn = !!localStorage.getItem('accessToken');
  if (!isLoggedIn) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg-canvas">
        <div className="text-sm text-fg-tertiary">로그인 후 이용 가능합니다.</div>
      </div>
    );
  }

  const tabs: { key: NotificationMainTab; label: string }[] = [
    { key: 'chat', label: '채팅' },
    { key: 'file', label: '파일' },
    { key: 'aiMinutes', label: 'AI 회의록' },
  ];

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
                onClick={() => setActiveTab('멘션')}
                className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${
                  activeTab === '멘션'
                    ? 'border-b-[3px] border-fg-primary text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <AtSign size={15} />
                멘션
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

      <ChatRoomPanel
        target={
          room
            ? {
                id: room.id,
                displayName: room.displayName,
                displayImage: room.displayImage,
                presence: room.presence,
                isGroup: room.type === 'group',
                isFavorite: room.isFavorite,
              }
            : selectedNoti
              ? {
                  id: selectedNoti.id,
                  displayName: selectedNoti.title,
                  displayImage: selectedNoti.avatarUrl ?? null,
                }
              : null
        }
        emptyHeaderLabel="알림을 선택해주세요"
        tabs={tabs}
        activeTab={activeMainTab}
        onTabChange={(key) => setActiveMainTab(key as NotificationMainTab)}
        chatTabKey="chat"
        renderOtherTab={(tabKey) =>
          tabKey === 'file' ? (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-tertiary h-full min-h-[300px]">
              업로드된 파일이 없습니다.
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-tertiary h-full min-h-[300px]">
              생성된 AI 회의록이 없습니다.
            </div>
          )
        }
        isMuted={room ? mutedRoomIds.includes(room.id) : false}
        onToggleMute={room ? () => toggleMute(room.id) : undefined}
        onToggleFavorite={room ? handleToggleFavorite : undefined}
        messages={conversation.messages}
        isMessagesLoading={conversation.isMessagesLoading}
        roomMembers={conversation.roomMembers}
        messagesEndRef={conversation.messagesEndRef}
        isSelectingMessages={conversation.isSelectingMessages}
        selectedMessageIds={conversation.selectedMessageIds}
        onToggleMessageSelect={conversation.toggleMessageSelect}
        onStartSelecting={conversation.startSelecting}
        onCancelSelecting={conversation.cancelSelecting}
        onResetSelection={conversation.resetSelection}
        onConfirmSelection={() => conversation.confirmSelection(() => {})}
        typingLabel={conversation.typingLabel}
        onSend={conversation.sendMessage}
        onSendFile={conversation.sendFile}
        onTyping={conversation.notifyTyping}
        onOpenAiMinutes={conversation.startSelecting}
        onCreateDocument={conversation.createDocumentMessage}
        onDeleteMessage={conversation.deleteMessage}
      />
    </div>
  );
};
