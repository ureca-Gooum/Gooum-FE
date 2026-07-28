import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { connectSocket, onNewNotification, offNewNotification } from '@/socket/socket';
import { stripSenderPrefix } from '@/utils/notification';
import { formatTime, getDateGroupLabel } from '@/utils/formatTime';
import type { NotificationItem } from '@/types/notification';
import type { Room } from '@/types/chat';
import type { NewNotificationPayload } from '@/types/socket';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/api/notifications';
import { RoomFilesTab } from '@/components/chat/RoomFilesTab';
import { RoomDocumentsTab } from '@/components/chat/RoomDocumentsTab';

type NotificationMainTab = 'chat' | 'file' | 'aiMinutes';

export const NotificationsPage = () => {
  const currentUserId = getCurrentUserId();
  const navigate = useNavigate();

  // 초기 목록은 fetchNotifications()로 서버에서 받아온다 (아래 useEffect). 실시간으로 오는 새 알림은
  // onNewNotification 소켓 이벤트로 이 배열 맨 위에 추가된다.
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotiId, setSelectedNotiId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'전체' | 'DM' | '멘션' | '문서' | '채팅' | '파일'>('전체');
  const [activeMainTab, setActiveMainTab] = useState<NotificationMainTab>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 알림에 연결된 채팅방 상세 (아바타/이름/즐겨찾기 등 헤더 표시용) - ChatPage의 rooms 리스트 대신
  // 선택된 알림 하나에 대해서만 fetchRoomDetail로 가져온다. mapRoomFromApi를 그대로 재사용해서
  // ChatPage와 동일한 Room 모양을 만든다.
  const [room, setRoom] = useState<Room | null>(null);

  const { mutedRoomIds, toggleMute } = useMutedRooms();

  // 소켓은 Sidebar 배지도 같이 구독하는 전역 연결이라 페이지 언마운트로 끊으면 안 된다
  useEffect(() => {
    connectSocket();
  }, []);

  // 실시간 알림 수신: 멘션/DM 등 새 알림이 오면 목록 맨 위에 바로 반영한다.
  useEffect(() => {
    const handleNewNotification = (payload: NewNotificationPayload) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === payload.notificationId)) return prev;
        const newItem: NotificationItem = {
          id: payload.notificationId,
          type: payload.type as NotificationItem['type'],
          title: payload.title,
          content: stripSenderPrefix(payload.body),
          time: formatTime(payload.createdAt),
          createdAt: payload.createdAt,
          isRead: payload.isRead,
          roomId: payload.roomId,
        };
        return [newItem, ...prev];
      });
    };

    onNewNotification(handleNewNotification);
    return () => offNewNotification(handleNewNotification);
  }, []);

  const selectedNoti = notifications.find((n) => n.id === selectedNotiId) || notifications[0];
  const roomId = selectedNoti?.roomId ?? null;

  useEffect(() => {
    let isMounted = true;
    fetchNotifications()
      .then((res) => {
        if (isMounted) {
          setNotifications(res.data);
          if (res.data.length > 0) {
            // PC 화면(768px 이상)에서만 자동 선택하여 디자인 유지, 모바일에서는 리스트 표시
            if (window.innerWidth >= 768) {
              setSelectedNotiId(res.data[0].id);
            }
          }
        }
      })
      .catch((err) => console.error('알림을 불러오지 못했어요:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // roomId가 없으면 API 요청 없이 종료
    if (!roomId) return;

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
  const conversation = useRoomConversation(roomId, currentUserId, { targetMessageId: selectedNoti?.messageId });

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

  const filteredNotifications = notifications.filter((noti) => {
    if (activeTab === '전체') return true;
    if (activeTab === 'DM') return noti.type === 'message';
    if (activeTab === '멘션') return noti.type === 'mention';
    if (activeTab === '채팅') return noti.type === 'message' || noti.type === 'mention';
    if (activeTab === '파일') return noti.type === 'file';
    if (activeTab === '문서') return noti.type === 'document';
    return true;
  });

  const unreadChatCount = notifications.filter(
    (n) => (n.type === 'message' || n.type === 'mention') && !n.isRead,
  ).length;
  const unreadFileCount = notifications.filter((n) => n.type === 'file' && !n.isRead).length;
  const unreadDocCount = notifications.filter((n) => n.type === 'document' && !n.isRead).length;

  const handleSelectNoti = async (noti: NotificationItem) => {
    setSelectedNotiId(noti.id);
    setIsSidebarOpen(false);
    if (!noti.isRead) {
      try {
        await markNotificationAsRead(noti.id);
        setNotifications((prev) => prev.map((n) => (n.id === noti.id ? { ...n, isRead: true } : n)));
      } catch (err) {
        console.error('알림 읽음 처리 실패:', err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('전체 읽음 처리 실패:', err);
    }
  };

  // 멘션 카드의 "메시지 보내기": 이 페이지 자체는 방 목록을 들고 있지 않으므로,
  // ChatPage로 이동시키면서 open_dm 액션을 넘겨 그쪽의 기존 로직(기존 DM방 찾기/없으면 생성)을 그대로 태운다.
  const handleStartDirectMessage = (userId: string) => {
    if (!userId || userId === currentUserId) return;
    navigate('/app', { state: { action: 'open_dm', userId } });
  };

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
    { key: 'aiMinutes', label: '문서' },
  ];

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden relative w-full h-full">
      <ListPanel
        className={selectedNotiId ? 'hidden @md:flex' : 'flex'}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        header={
          <div className="flex flex-col justify-between px-4 pt-2.5" style={{ height: 63 }}>
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-fg-primary">내 활동</h2>
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-fg-tertiary hover:text-fg-primary transition-colors">
                모두 읽음
              </button>
            </div>
            {/* PC 전용 기존 탭 (모바일에서는 숨김) */}
            <div className="hidden @md:flex gap-5 -mb-4 border-b border-border-default pb-0">
              <button
                onClick={() => setActiveTab('전체')}
                className={`relative pb-2.5 text-[13px] font-bold transition-colors ${
                  activeTab === '전체' ? 'text-fg-primary' : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                전체
                {activeTab === '전체' && (
                  <motion.span
                    layoutId="activity-tab-underline"
                    className="absolute left-0 right-0 rounded-full bg-brand-primary"
                    style={{ bottom: '-1px', height: '3px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('DM')}
                className={`relative pb-2.5 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${
                  activeTab === 'DM' ? 'text-fg-primary' : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <MessageCircle size={15} />
                DM
                {activeTab === 'DM' && (
                  <motion.span
                    layoutId="activity-tab-underline"
                    className="absolute left-0 right-0 rounded-full bg-brand-primary"
                    style={{ bottom: '-1px', height: '3px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab('멘션')}
                className={`relative pb-2.5 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${
                  activeTab === '멘션' ? 'text-fg-primary' : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <AtSign size={15} />
                멘션
                {activeTab === '멘션' && (
                  <motion.span
                    layoutId="activity-tab-underline"
                    className="absolute left-0 right-0 rounded-full bg-brand-primary"
                    style={{ bottom: '-1px', height: '3px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('문서')}
                className={`relative pb-2.5 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${
                  activeTab === '문서' ? 'text-fg-primary' : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <FileText size={15} />
                문서
                {activeTab === '문서' && (
                  <motion.span
                    layoutId="activity-tab-underline"
                    className="absolute left-0 right-0 rounded-full bg-brand-primary"
                    style={{ bottom: '-1px', height: '3px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            </div>

            {/* 모바일 전용 새 탭 (PC에서는 숨김) */}
            <div className="flex @md:hidden gap-5 -mb-4 border-b border-border-default pb-0">
              <button
                onClick={() => setActiveTab('채팅')}
                className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors relative ${
                  activeTab === '채팅'
                    ? 'border-b-[3px] border-fg-primary text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <MessageCircle size={15} />
                채팅
                {unreadChatCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('파일')}
                className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors relative ml-3 ${
                  activeTab === '파일'
                    ? 'border-b-[3px] border-fg-primary text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <FileText size={15} />
                파일
                {unreadFileCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                    {unreadFileCount > 99 ? '99+' : unreadFileCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('문서')}
                className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors relative ml-3 ${
                  activeTab === '문서'
                    ? 'border-b-[3px] border-fg-primary text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-primary'
                }`}>
                <FileText size={15} />
                문서
                {unreadDocCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                    {unreadDocCount > 99 ? '99+' : unreadDocCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        }>
        <div className="flex flex-col h-full overflow-y-auto px-2 py-2">
          {filteredNotifications.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredNotifications.map((noti, index) => {
                const prevNoti = filteredNotifications[index - 1];
                const label = getDateGroupLabel(noti.createdAt);
                const showDivider = !prevNoti || getDateGroupLabel(prevNoti.createdAt) !== label;

                return (
                  <div key={noti.id} className="flex flex-col gap-2">
                    {showDivider && <DateDivider label={label} />}
                    <NotificationListItem
                      notification={noti}
                      isSelected={selectedNotiId === noti.id}
                      onSelect={() => handleSelectNoti(noti)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-tertiary mt-10">
              {activeTab} 내역이 없습니다.
            </div>
          )}
        </div>
      </ListPanel>

      <div className={`flex-1 min-w-0 h-full ${selectedNotiId ? 'flex' : 'hidden @md:flex'}`}>
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
                  userId: room.otherUserId,
                  memberCount: room.memberCount,
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
              <RoomFilesTab messages={conversation.messages} isLoading={conversation.isMessagesLoading} />
            ) : roomId ? (
              <RoomDocumentsTab roomId={roomId} />
            ) : null
          }
          isMuted={room ? mutedRoomIds.includes(room.id) : false}
          onToggleMute={room ? () => toggleMute(room.id) : undefined}
          onToggleFavorite={room ? handleToggleFavorite : undefined}
          messages={conversation.messages}
          isMessagesLoading={conversation.isMessagesLoading}
          roomMembers={conversation.roomMembers}
          mentionCandidates={conversation.allMembers}
          messagesEndRef={conversation.messagesEndRef}
          isSelectingMessages={conversation.isSelectingMessages}
          selectedMessageIds={conversation.selectedMessageIds}
          onToggleMessageSelect={conversation.toggleMessageSelect}
          onStartSelecting={conversation.startSelecting}
          onCancelSelecting={conversation.cancelSelecting}
          onResetSelection={conversation.resetSelection}
          onConfirmSelection={() => conversation.confirmSelection(() => {})}
          typingLabel={conversation.typingLabel ?? undefined}
          onSend={conversation.sendMessage}
          onSendFile={conversation.sendFile}
          onTyping={conversation.notifyTyping}
          onOpenAiMinutes={conversation.startSelecting}
          onCreateDocument={conversation.createDocumentMessage}
          onDeleteMessage={conversation.deleteMessage}
          onStartDirectMessage={handleStartDirectMessage}
          targetMessageId={selectedNoti?.messageId}
        />
      </div>
    </div>
  );
};
