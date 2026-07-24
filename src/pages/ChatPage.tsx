import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Heart, MessageCircle } from 'lucide-react';
import { ListPanel } from '@/components/layout/ListPanel';
import { ChatRoomPanel } from '@/components/chat/ChatRoomPanel';
import { RoomFilesTab } from '@/components/chat/RoomFilesTab';
import { RoomDocumentsTab } from '@/components/chat/RoomDocumentsTab';
import { NewChatModal } from '@/components/NewChatModal';
import { RoomListItem } from '@/components/RoomListItem';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { fetchRooms, toggleFavorite, leaveRoom, createRoom } from '@/api/rooms';
import { mapRoomFromApi } from '@/api/mappers/roomMapper';
import { connectSocket, disconnectSocket, onNewNotification, offNewNotification } from '@/socket/socket';
import { getCurrentUserId } from '@/constants/auth';
import { useRoomConversation } from '@/hooks/useRoomConversation';
import { useMutedRooms } from '@/hooks/useMutedRooms';
import { usePresence } from '@/hooks/usePresence';
import { formatTime } from '@/utils/formatTime';
import { stripSenderPrefix } from '@/utils/notification';
import { buildLastMessagePreview } from '@/utils/tiptap';
import type { Room } from '@/types/chat';
import type { RoomApiResponse } from '@/types/room';
import type { NewNotificationPayload } from '@/types/socket';

type PanelTab = 'chat' | 'file' | 'docs';

export const ChatPage = () => {
  const currentUserId = getCurrentUserId(); // 컴포넌트 안에서 매번 최신값 계산
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [openMenuRoomId, setOpenMenuRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');

  const { mutedRoomIds, toggleMute } = useMutedRooms();

  // 채팅방 하나(selectedRoomId)에 대한 메시지/소켓/입력/AI캡쳐선택 로직은 전부 이 훅이 담당한다.
  // 내가 보낸 메시지가 도착하면 사이드바 미리보기(rooms 목록)를 갱신해야 하므로 onMessageSent로 위임받는다.
  const conversation = useRoomConversation(selectedRoomId, currentUserId, {
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
  });

  useEffect(() => {
    fetchRooms()
      .then((data) => setRooms(data.rooms.map(mapRoomFromApi)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // 소켓 연결 - 앱 진입 시 한 번만
  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      console.log('✅ 소켓 연결됨:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ 소켓 끊김:', reason);
    });

    return () => disconnectSocket();
  }, []);

  usePresence(setRooms);

  // 실시간 알림 수신 (다른 방에서 온 메시지의 미리보기/안읽음 배지 갱신 - 방 목록 소유 상태라 여기 유지)
  useEffect(() => {
    const handleNewNotification = (payload: NewNotificationPayload) => {
      if (payload.type !== 'message') return;

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
          unreadCount: isRoomOpen ? room.unreadCount : room.unreadCount + 1,
        };

        const rest = prev.filter((r) => r.id !== payload.roomId);
        return [updatedRoom, ...rest];
      });
    };

    onNewNotification(handleNewNotification);
    return () => offNewNotification(handleNewNotification);
  }, [selectedRoomId]);

  const handleRoomCreated = (newRoom: RoomApiResponse) => {
    setRooms((prev) => [mapRoomFromApi(newRoom), ...prev]);
    setIsModalOpen(false);
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
      alert(err.message);
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setActiveTab('chat');
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)));
  };

  // 멘션 호버 카드의 "메시지 보내기": 이미 DM방이 있으면 그 방을 열고, 없으면 새로 만들어서 연다.
  const handleStartDirectMessage = async (userId: string) => {
    if (!userId || userId === currentUserId) return;

    const existingRoom = rooms.find((r) => r.type === 'direct' && r.otherUserId === userId);
    if (existingRoom) {
      handleSelectRoom(existingRoom.id);
      return;
    }

    try {
      const room = await createRoom({ type: 'direct', memberIds: [userId] });
      setRooms((prev) => [mapRoomFromApi(room), ...prev]);
      handleSelectRoom(room.roomId);
    } catch (err: any) {
      alert(err.message ?? 'DM방을 여는 데 실패했어요.');
    }
  };

  const handleConfirmSelection = () => {
    conversation.confirmSelection((selectedMessages) => {
      navigate('/app/docs', { state: { roomId: selectedRoomId, messages: selectedMessages } });
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
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
    <div className="flex min-w-0 flex-1 overflow-hidden">
      <ListPanel
        header={
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-fg-primary">채팅</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle">
              <Plus size={18} />
            </button>
          </div>
        }>
        <div className="flex items-center gap-1.5 px-4 py-3.5">
          <Heart size={14} className="text-fg-tertiary" />
          <p className="text-xs font-medium text-fg-tertiary">즐겨찾기</p>
        </div>
        {favoriteRooms.map((room) => (
          <RoomListItem
            key={room.id}
            room={room}
            onSelect={() => handleSelectRoom(room.id)}
            onToggleFavorite={handleToggleFavorite}
            onLeave={handleLeave}
            isMenuOpen={openMenuRoomId === room.id}
            onMenuToggle={() => setOpenMenuRoomId(openMenuRoomId === room.id ? null : room.id)}
          />
        ))}

        <div className="flex items-center gap-1.5 px-4 py-3.5">
          <MessageCircle size={14} className="text-fg-tertiary" />
          <p className="text-xs font-medium text-fg-tertiary">채팅</p>
        </div>
        {otherRooms.map((room) => (
          <RoomListItem
            key={room.id}
            room={room}
            onSelect={() => handleSelectRoom(room.id)}
            onToggleFavorite={handleToggleFavorite}
            onLeave={handleLeave}
            isMenuOpen={openMenuRoomId === room.id}
            onMenuToggle={() => setOpenMenuRoomId(openMenuRoomId === room.id ? null : room.id)}
          />
        ))}
      </ListPanel>

      {isModalOpen && <NewChatModal onClose={() => setIsModalOpen(false)} onCreated={handleRoomCreated} />}

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
              }
            : null
        }
        emptyHeaderLabel="채팅방을 선택해주세요"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as PanelTab)}
        chatTabKey="chat"
        renderOtherTab={(tabKey) =>
          tabKey === 'file' ? (
            <RoomFilesTab messages={conversation.messages} />
          ) : selectedRoomId ? (
            <RoomDocumentsTab roomId={selectedRoomId} />
          ) : null
        }
        isMuted={selectedRoom ? mutedRoomIds.includes(selectedRoom.id) : false}
        onToggleMute={selectedRoom ? () => toggleMute(selectedRoom.id) : undefined}
        onToggleFavorite={
          selectedRoom ? () => handleToggleFavorite(selectedRoom.id, selectedRoom.isFavorite) : undefined
        }
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
        onConfirmSelection={handleConfirmSelection}
        typingLabel={conversation.typingLabel}
        onSend={conversation.sendMessage}
        onSendFile={conversation.sendFile}
        onTyping={conversation.notifyTyping}
        onOpenAiMinutes={conversation.startSelecting}
        onCreateDocument={conversation.createDocumentMessage}
        onDeleteMessage={conversation.deleteMessage}
        onStartDirectMessage={handleStartDirectMessage}
      />
    </div>
  );
};
