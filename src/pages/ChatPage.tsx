import { useEffect, useState } from 'react';
import { showAlert } from '@/utils/alert';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, ChevronDown, ChevronRight, SquarePen } from 'lucide-react';
import { ListPanel } from '@/components/layout/ListPanel';
import { ChatRoomPanel } from '@/components/chat/ChatRoomPanel';
import { RoomFilesTab } from '@/components/chat/RoomFilesTab';
import { RoomDocumentsTab } from '@/components/chat/RoomDocumentsTab';
import { NewChatModal } from '@/components/NewChatModal';
import { InviteMemberModal } from '@/components/chat/InviteMemberModal';
import { RenameRoomModal } from '@/components/chat/RenameRoomModal';
import { RoomListItem } from '@/components/RoomListItem';
import { RoomListItemSkeleton } from '@/components/RoomListItemSkeleton';
import { MessageAreaSkeleton } from '@/components/MessageAreaSkeleton';
import { Skeleton } from '@/components/Skeleton';
import { fetchRooms, toggleFavorite, leaveRoom, createRoom } from '@/api/rooms';
import { mapRoomFromApi } from '@/api/mappers/roomMapper';
import { connectSocket, onNewNotification, offNewNotification } from '@/socket/socket';
import { getCurrentUserId } from '@/constants/auth';
import { useRoomConversation } from '@/hooks/useRoomConversation';
import { useMutedRooms } from '@/hooks/useMutedRooms';
import { usePresence } from '@/hooks/usePresence';
import { formatTime } from '@/utils/formatTime';
import { stripSenderPrefix } from '@/utils/notification';
import { buildLastMessagePreview } from '@/utils/tiptap';
import type { Room } from '@/types/chat';
import type { RoomApiResponse, RoomMember } from '@/types/room';
import type { NewNotificationPayload } from '@/types/socket';

type PanelTab = 'chat' | 'file' | 'docs';

export const ChatPage = () => {
  const currentUserId = getCurrentUserId(); // 컴포넌트 안에서 매번 최신값 계산
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as {
    action?: string;
    userId?: string;
    roomId?: string;
    targetMessageId?: string;
  } | null;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [openMenuRoomId, setOpenMenuRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [isChatsOpen, setIsChatsOpen] = useState(true);

  const { mutedRoomIds, toggleMute } = useMutedRooms();

  // 현재 열린 방이 navState에 명시된 방과 같을 때만 targetMessageId를 활성화
  const targetMessageId = selectedRoomId === navState?.roomId ? navState?.targetMessageId : undefined;
  const conversation = useRoomConversation(selectedRoomId, currentUserId, {
    targetMessageId,
    onMessageSent: (payload) => {
      setRooms((prev) => {
        const index = prev.findIndex((r) => r.id === payload.roomId);
        if (index === -1) return prev;

        const preview = buildLastMessagePreview({
          type: payload.type,
          content: payload.content,
          fileName: payload.fileName,
        });

        const updatedRoom: Room = {
          ...prev[index],
          lastMessagePreview: `나: ${preview}`,
          lastMessageTime: formatTime(payload.createdAt),
        };

        const rest = prev.filter((r) => r.id !== payload.roomId);
        return [updatedRoom, ...rest];
      });
    },

    onMessageDeleted: ({ roomId, wasLastMessage }) => {
      if (!wasLastMessage) return;
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, lastMessagePreview: '삭제된 메시지입니다' } : r)));
    },
  });

  useEffect(() => {
    fetchRooms()
      .then((data) => setRooms(data.rooms.map(mapRoomFromApi)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // 네비게이션 상태(location.state)를 감지하여 특정 채팅방이나 유저 DM을 열도록 처리
  useEffect(() => {
    if (!navState || rooms.length === 0) return;

    if (navState.action === 'open_dm' && navState.userId) {
      const existingRoom = rooms.find((r) => r.type === 'direct' && r.otherUserId === navState.userId);
      if (existingRoom) {
        handleSelectRoom(existingRoom.id);
        navigate('/app', { replace: true });
      } else {
        createRoom({ type: 'direct', memberIds: [navState.userId] })
          .then((newRoom) => {
            setRooms((prev) => [mapRoomFromApi(newRoom), ...prev]);
            handleSelectRoom(newRoom.roomId);
            navigate('/app', { replace: true });
          })
          .catch((err) => showAlert(err.message ?? 'DM방을 여는 데 실패했어요.'));
      }
    } else if (navState.roomId) {
      handleSelectRoom(navState.roomId);
    }
  }, [location.state, rooms.length]);

  // 소켓은 Sidebar 배지도 같이 구독하는 전역 연결이라 페이지 언마운트로 끊으면 안 된다
  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      console.log('✅ 소켓 연결됨:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ 소켓 끊김:', reason);
    });
  }, []);

  usePresence(setRooms);

  // 실시간 알림 수신 (다른 방에서 온 메시지의 미리보기/안읽음 배지 갱신 - 방 목록 소유 상태라 여기 유지)
  useEffect(() => {
    const handleNewNotification = (payload: NewNotificationPayload) => {
      if (payload.type !== 'message' && payload.type !== 'mention') return;

      setRooms((prev) => {
        const index = prev.findIndex((r) => r.id === payload.roomId);
        if (index === -1) return prev;

        const isRoomOpen = payload.roomId === selectedRoomId;
        const room = prev[index];

        const preview = stripSenderPrefix(payload.body);

        const updatedRoom: Room = {
          ...room,
          lastMessagePreview: preview,
          lastMessageTime: formatTime(payload.createdAt),
          unreadCount: isRoomOpen || payload.isRead ? room.unreadCount : room.unreadCount + 1,
        };

        const rest = prev.filter((r) => r.id !== payload.roomId);
        return [updatedRoom, ...rest];
      });
    };

    onNewNotification(handleNewNotification);
    return () => offNewNotification(handleNewNotification);
  }, [selectedRoomId]);

  const handleRoomCreated = (newRoom: RoomApiResponse) => {
    setRooms((prev) => {
      if (prev.some((r) => r.id === newRoom.roomId)) return prev;
      return [mapRoomFromApi(newRoom), ...prev];
    });
    setIsModalOpen(false);
    handleSelectRoom(newRoom.roomId);
  };

  const handleToggleFavorite = async (roomId: string, current: boolean) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, isFavorite: !current } : r)));
    try {
      await toggleFavorite(roomId, !current);
    } catch {
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, isFavorite: current } : r)));
    }
  };

  const handleLeave = async (roomId: string) => {
    try {
      await leaveRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (selectedRoomId === roomId) setSelectedRoomId(null);
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setActiveTab('chat');
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)));
    setIsSidebarOpen(false);

    if (window.innerWidth < 768) {
      navigate('#panel');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (selectedRoomId) {
        setSelectedRoomId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedRoomId]);

  const handleStartDirectMessage = async (userId: string) => {
    if (!userId || userId === currentUserId) return;

    const existingRoom = rooms.find((r) => r.type === 'direct' && r.otherUserId === userId);
    if (existingRoom) {
      handleSelectRoom(existingRoom.id);
      return;
    }

    try {
      const room = await createRoom({ type: 'direct', memberIds: [userId] });
      setRooms((prev) => {
        if (prev.some((r) => r.id === room.roomId)) return prev;
        return [mapRoomFromApi(room), ...prev];
      });
      handleSelectRoom(room.roomId);
    } catch (err: any) {
      showAlert(err.message ?? 'DM방을 여는 데 실패했어요.');
    }
  };

  const handleMembersInvited = (addedMembers: RoomMember[]) => {
    conversation.addRoomMembers(addedMembers);
    setRooms((prev) =>
      prev.map((r) => (r.id === selectedRoomId ? { ...r, memberCount: r.memberCount + addedMembers.length } : r))
    );
    setIsInviteModalOpen(false);
  };

  const handleRoomRenamed = (newName: string) => {
    setRooms((prev) => prev.map((r) => (r.id === selectedRoomId ? { ...r, displayName: newName } : r)));
    setIsRenameModalOpen(false);
  };

  const handleConfirmSelection = () => {
    conversation.confirmSelection((selectedMessages) => {
      navigate('/app/docs', { state: { roomId: selectedRoomId, messages: selectedMessages } });
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-1 w-full h-full">
        <ListPanel className="flex" headerHeight={63} header={<Skeleton className="h-5 w-14 rounded-full" />}>
          <div className="flex flex-col gap-1 py-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <RoomListItemSkeleton key={i} />
            ))}
          </div>
        </ListPanel>

        <section
          className="relative z-10 flex min-w-[480px] flex-1 flex-col overflow-hidden rounded-lg bg-bg-default"
          style={{ boxShadow: '0 6px 18px -6px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06)' }}>
          <div className="flex h-[63px] shrink-0 items-center gap-3 border-b border-border-default px-4">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <div className="flex-1 overflow-hidden px-6 py-4">
            <MessageAreaSkeleton />
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return <div className="flex flex-1 items-center justify-center text-error">{error}</div>;
  }

  const favoriteRooms = rooms.filter((r) => r.isFavorite);
  const otherRooms = rooms.filter((r) => !r.isFavorite);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const tabs: { key: PanelTab; label: string }[] = [
    { key: 'chat', label: '채팅' },
    { key: 'file', label: '파일' },
    { key: 'docs', label: '문서' },
  ];

  return (
    <div className="flex min-w-0 min-h-0 flex-1 relative w-full h-full">
      <ListPanel
        className={selectedRoomId ? 'hidden @md:flex' : 'flex'}
        headerHeight={63}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        header={
          <div className="flex w-full items-center justify-between">
            <h2 className="font-semibold text-fg-primary">채팅</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              data-tour="new-chat"
              className="rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle">
              <SquarePen size={18} />
            </button>
          </div>
        }>
        <button
          type="button"
          onClick={() => setIsFavoritesOpen((prev) => !prev)}
          className="flex w-full items-center gap-1.5 px-4 py-3.5 text-left hover:bg-bg-subtle">
          <Heart size={14} className="text-fg-tertiary" />
          <p className="flex-1 text-xs font-medium text-fg-tertiary">즐겨찾기</p>
          {isFavoritesOpen ? (
            <ChevronDown size={14} className="text-fg-tertiary" />
          ) : (
            <ChevronRight size={14} className="text-fg-tertiary" />
          )}
        </button>
        {isFavoritesOpen &&
          favoriteRooms.map((room) => (
            <RoomListItem
              key={room.id}
              room={room}
              onSelect={() => handleSelectRoom(room.id)}
              onToggleFavorite={handleToggleFavorite}
              onLeave={handleLeave}
              isMenuOpen={openMenuRoomId === room.id}
              onMenuToggle={() => setOpenMenuRoomId(openMenuRoomId === room.id ? null : room.id)}
              isActive={selectedRoomId === room.id}
            />
          ))}

        <button
          type="button"
          onClick={() => setIsChatsOpen((prev) => !prev)}
          className="flex w-full items-center gap-1.5 px-4 py-3.5 text-left hover:bg-bg-subtle">
          <MessageCircle size={14} className="text-fg-tertiary" />
          <p className="flex-1 text-xs font-medium text-fg-tertiary">채팅</p>
          {isChatsOpen ? (
            <ChevronDown size={14} className="text-fg-tertiary" />
          ) : (
            <ChevronRight size={14} className="text-fg-tertiary" />
          )}
        </button>
        {isChatsOpen &&
          otherRooms.map((room) => (
            <RoomListItem
              key={room.id}
              room={room}
              onSelect={() => handleSelectRoom(room.id)}
              onToggleFavorite={handleToggleFavorite}
              onLeave={handleLeave}
              isMenuOpen={openMenuRoomId === room.id}
              onMenuToggle={() => setOpenMenuRoomId(openMenuRoomId === room.id ? null : room.id)}
              isActive={selectedRoomId === room.id}
            />
          ))}
      </ListPanel>

      {isModalOpen && <NewChatModal onClose={() => setIsModalOpen(false)} onCreated={handleRoomCreated} />}

      {isInviteModalOpen && selectedRoomId && (
        <InviteMemberModal
          roomId={selectedRoomId}
          existingMemberIds={conversation.roomMembers.map((m) => m.userId)}
          onClose={() => setIsInviteModalOpen(false)}
          onInvited={handleMembersInvited}
        />
      )}

      <div className={`relative z-10 flex-1 min-w-0 h-full ${selectedRoomId ? 'flex' : 'hidden @md:flex'}`}>
        {isRenameModalOpen && selectedRoomId && selectedRoom && (
          <RenameRoomModal
            roomId={selectedRoomId}
            currentName={selectedRoom.displayName}
            onClose={() => setIsRenameModalOpen(false)}
            onRenamed={handleRoomRenamed}
          />
        )}
        <ChatRoomPanel
          target={
            selectedRoom
              ? {
                  id: selectedRoom.id,
                  displayName: selectedRoom.displayName,
                  displayImage: selectedRoom.displayImage,
                  presence: selectedRoom.presence,
                  isGroup: selectedRoom.type === 'group',
                  isFavorite: selectedRoom.isFavorite,
                  userId: selectedRoom.otherUserId,
                  memberCount: selectedRoom.memberCount,
                }
              : null
          }
          emptyHeaderLabel="채팅방을 선택해주세요"
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatTabKey="chat"
          renderOtherTab={(tabKey) =>
            tabKey === 'file' ? (
              <RoomFilesTab messages={conversation.messages} isLoading={conversation.isMessagesLoading} />
            ) : selectedRoomId ? (
              <RoomDocumentsTab roomId={selectedRoomId} />
            ) : null
          }
          isMuted={selectedRoom ? mutedRoomIds.includes(selectedRoom.id) : false}
          onToggleMute={selectedRoom ? () => toggleMute(selectedRoom.id) : undefined}
          onToggleFavorite={
            selectedRoom ? () => handleToggleFavorite(selectedRoom.id, selectedRoom.isFavorite) : undefined
          }
          onInviteMembers={
            selectedRoom?.type === 'group' ? () => setIsInviteModalOpen(true) : undefined
          }
          onRenameGroup={selectedRoom?.type === 'group' ? () => setIsRenameModalOpen(true) : undefined}
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
          onConfirmSelection={handleConfirmSelection}
          typingLabel={conversation.typingLabel ?? undefined}
          onSend={conversation.sendMessage}
          onSendFile={conversation.sendFile}
          onTyping={conversation.notifyTyping}
          onOpenAiMinutes={conversation.startSelecting}
          onCreateDocument={conversation.createDocumentMessage}
          onDeleteMessage={conversation.deleteMessage}
          onStartDirectMessage={handleStartDirectMessage}
          targetMessageId={targetMessageId}
        />
      </div>
    </div>
  );
};
