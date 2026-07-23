import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Heart, MessageCircle, Pencil } from 'lucide-react';
import { DateDivider } from '@/components/DateDivider';
import { ListPanel } from '@/components/layout/ListPanel';
import { MainPanel } from '@/components/layout/MainPanel';
import { MessageBubble } from '@/components/MessageBubble';
import { NewChatModal } from '@/components/NewChatModal';
import { RoomListItem } from '@/components/RoomListItem';
import { Avatar } from '@/components/Avatar';
import { ChatMessageInput } from '@/components/ChatMessageInput';
import { fetchRooms, toggleFavorite, leaveRoom } from '@/api/rooms';
import { mapRoomFromApi } from '@/api/mappers/roomMapper';
import { fetchMessages, deleteMessage } from '@/api/messages';
import { mapMessageFromApi } from '@/api/mappers/messageMapper';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinRoom,
  leaveRoom as leaveSocketRoom,
  sendMessage,
  onNewMessage,
  offNewMessage,
  onNewNotification,
  offNewNotification,
  onMessageDeleted,
  offMessageDeleted,
} from '@/socket/socket';
import { getCurrentUserId } from '@/constants/auth';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePresence } from '@/hooks/usePresence';
import { formatTime } from '@/utils/formatTime';
import { stripSenderPrefix } from '@/utils/notification';
import { buildLastMessagePreview } from '@/utils/tiptap';
import type { Room, Message, TiptapDoc } from '@/types/chat';
import type { RoomApiResponse } from '@/types/room';
import type { NewMessagePayload, NewNotificationPayload, MessageDeletedPayload } from '@/types/socket';

function getDateLabel(time: string) {
  return time.split(',')[0];
}

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
  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { typingLabel, notifyTyping } = useTypingIndicator(selectedRoomId);

  // ── AI 회의록: 카톡 캡쳐처럼 메시지 범위를 선택하는 모드 상태 ──
  const [isSelectingMessages, setIsSelectingMessages] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms()
      .then((data) => setRooms(data.rooms.map(mapRoomFromApi)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // 1. 소켓 연결 - 앱 진입 시 한 번만
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

  // 2. 방 선택 시 입장/퇴장 + 과거 메시지 불러오기
  useEffect(() => {
    if (!selectedRoomId) {
      setRoomMessages([]);
      return;
    }
    console.log('🚪 입장 시도하는 roomId:', selectedRoomId);

    const socket = getSocket();

    const doJoin = () => {
      joinRoom(selectedRoomId, (response: any) => {
        console.log('joinRoom 응답:', response);
      });
    };

    if (socket?.connected) {
      doJoin();
    } else {
      socket?.once('connect', doJoin);
    }

    setIsMessagesLoading(true);
    fetchMessages({ roomId: selectedRoomId })
      .then((data) => {
        const mapped = data.messages.map(mapMessageFromApi).reverse();
        setRoomMessages(mapped);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsMessagesLoading(false));

    return () => {
      leaveSocketRoom(selectedRoomId, (response: any) => {
        console.log('leaveRoom 응답:', response);
      });
    };
  }, [selectedRoomId]);

  // 3. 새 메시지 수신
  useEffect(() => {
    const handleNewMessage = (payload: NewMessagePayload) => {
      console.log('🔔 newMessage 이벤트 도착!', payload);
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === payload.messageId)) return prev;
        const receivedMessage: Message = {
          id: payload.messageId,
          roomId: payload.roomId,
          senderId: payload.sender.userId,
          senderName: payload.sender.name,
          content: payload.content,
          time: new Date(payload.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
          isMine: payload.sender.userId === currentUserId,
          isDeleted: false,
        };
        return [...prev, receivedMessage];
      });

      if (payload.sender.userId === currentUserId) {
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
      }
    };

    onNewMessage(handleNewMessage);
    return () => offNewMessage(handleNewMessage);
  }, [currentUserId]);

  // 4. 실시간 알림 수신
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

  // 5. 메시지 삭제
  const updateMessageAsDeleted = (messageId: string) => {
    setRoomMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m)));
    setLocalMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m)));
  };

  useEffect(() => {
    const handleMessageDeleted = (payload: MessageDeletedPayload) => {
      updateMessageAsDeleted(payload.messageId);
    };

    onMessageDeleted(handleMessageDeleted);
    return () => offMessageDeleted(handleMessageDeleted);
  }, []);

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
    setLocalMessages([]);
    setIsSelectingMessages(false);
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)));
  };

  const handleSendMessage = (content: TiptapDoc) => {
    if (!selectedRoomId) return;

    sendMessage({ roomId: selectedRoomId, type: 'text', content }, (response: any) => {
      console.log('sendMessage 응답:', response);
    });
  };

  // ── AI 회의록: 카톡 캡쳐처럼 메시지를 클릭해 범위를 선택하는 모드 ──
  const handleStartSelectingMessages = () => {
    if (!selectedRoomId) return;
    setIsSelectingMessages(true);
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  };

  const handleCancelSelectingMessages = () => {
    setIsSelectingMessages(false);
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  };

  const handleResetSelection = () => {
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  };

  const handleToggleMessageSelect = (messageId: string) => {
    const ids = currentMessages.map((m) => m.id);
    const clickedIndex = ids.indexOf(messageId);
    if (clickedIndex === -1) return;

    // 아직 아무것도 선택 안 한 상태 → 이 메시지를 시작점으로 지정
    if (selectedMessageIds.length === 0) {
      setSelectionAnchorId(messageId);
      setSelectedMessageIds([messageId]);
      return;
    }

    // 시작점 하나만 선택된 상태에서 같은 메시지를 다시 클릭 → 선택 해제
    if (selectedMessageIds.length === 1 && selectionAnchorId === messageId) {
      setSelectionAnchorId(null);
      setSelectedMessageIds([]);
      return;
    }

    // 시작점을 기준으로, 클릭한 지점까지의 범위를 전부 선택 (끝점은 다시 클릭해서 조정 가능)
    if (selectionAnchorId) {
      const anchorIndex = ids.indexOf(selectionAnchorId);
      if (anchorIndex !== -1) {
        const [from, to] = anchorIndex < clickedIndex ? [anchorIndex, clickedIndex] : [clickedIndex, anchorIndex];
        setSelectedMessageIds(ids.slice(from, to + 1));
        return;
      }
    }

    // 예외 상황 대비: 새로 시작
    setSelectionAnchorId(messageId);
    setSelectedMessageIds([messageId]);
  };

  const handleConfirmSelection = () => {
    if (!selectedRoomId || selectedMessageIds.length === 0) return;
    // 실제 메시지 내용(TiptapDoc)까지 함께 넘겨야 Docs 페이지에서 서버 재조회 없이 바로 AI에 보낼 수 있음
    const selectedMessages = currentMessages.filter((m) => selectedMessageIds.includes(m.id));
    navigate('/app/docs', { state: { roomId: selectedRoomId, messages: selectedMessages } });
    setIsSelectingMessages(false);
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('메시지를 삭제하시겠어요?')) return;
    try {
      await deleteMessage(messageId);
      updateMessageAsDeleted(messageId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const favoriteRooms = rooms.filter((r) => r.isFavorite);
  const otherRooms = rooms.filter((r) => !r.isFavorite);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentMessages = [...roomMessages, ...localMessages.filter((m) => m.roomId === selectedRoomId)];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-fg-tertiary">불러오는 중...</div>;
  }

  if (error) {
    return <div className="flex flex-1 items-center justify-center text-error">{error}</div>;
  }

  const tabs: { key: PanelTab; label: string }[] = [
    { key: 'chat', label: '채팅' },
    { key: 'file', label: '파일' },
    { key: 'docs', label: '문서' },
  ];

  return (
    <div className="flex flex-1">
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

      <MainPanel
        header={
          selectedRoom ? (
            <div className="flex h-[63px] items-center gap-3 border-b border-border-default px-4">
              <Avatar
                seed={selectedRoom.id}
                imageUrl={selectedRoom.displayImage}
                presence={selectedRoom.presence}
                alt={selectedRoom.displayName}
                size={28}
              />

              <h2 className="shrink-0 font-semibold text-fg-primary">{selectedRoom.displayName}</h2>

              {selectedRoom.type === 'group' && (
                <button
                  onClick={() => {
                    /* 그룹 이름 수정 - 나중에 구현 */
                  }}
                  className="shrink-0 text-fg-tertiary hover:text-brand-primary">
                  <Pencil size={16} />
                </button>
              )}

              <div className="flex items-center gap-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative text-sm ${
                      activeTab === tab.key ? 'font-medium text-brand-primary' : 'text-fg-tertiary'
                    }`}>
                    {tab.label}
                    {activeTab === tab.key && (
                      <span
                        className="absolute left-0 right-0 bg-brand-primary"
                        style={{ bottom: '-17px', height: '2px' }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleToggleFavorite(selectedRoom.id, selectedRoom.isFavorite)}
                className="ml-auto shrink-0">
                <Heart
                  size={18}
                  fill={selectedRoom.isFavorite ? 'currentColor' : 'none'}
                  className={selectedRoom.isFavorite ? 'text-brand-primary' : 'text-fg-tertiary'}
                />
              </button>
            </div>
          ) : (
            <div className="flex h-[63px] items-center border-b border-border-default px-4">
              <h2 className="text-fg-tertiary">채팅방을 선택해주세요</h2>
            </div>
          )
        }
        footer={
          selectedRoom && activeTab === 'chat' ? (
            isSelectingMessages ? (
              <div className="flex items-center justify-between rounded-lg bg-bg-subtle px-3 py-2.5">
                <span className="text-sm text-fg-primary">
                  {selectedMessageIds.length > 0
                    ? `${selectedMessageIds.length}개 메시지 선택됨`
                    : '요약할 메시지의 시작점을 클릭해주세요'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleResetSelection}
                    disabled={selectedMessageIds.length === 0}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-fg-tertiary hover:bg-bg-canvas disabled:opacity-40">
                    초기화
                  </button>
                  <button
                    onClick={handleCancelSelectingMessages}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-fg-tertiary hover:bg-bg-canvas">
                    취소
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    disabled={selectedMessageIds.length === 0}
                    className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
                    다음
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {typingLabel && <p className="px-1 text-xs text-fg-tertiary">{typingLabel}</p>}
                <ChatMessageInput
                  onSend={handleSendMessage}
                  onTyping={notifyTyping}
                  onOpenAiMinutes={handleStartSelectingMessages}
                />
              </div>
            )
          ) : undefined
        }>
        {activeTab === 'chat' ? (
          isMessagesLoading ? (
            <p className="text-sm text-fg-tertiary">메시지 불러오는 중...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {isSelectingMessages && (
                <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand-primary">
                  메시지를 클릭해 요약할 범위를 선택해주세요. 시작점을 누르고, 끝점을 누르면 그 사이가 전부 선택돼요.
                </p>
              )}
              {currentMessages.map((msg, index) => {
                const prevMsg = currentMessages[index - 1];
                const showDateDivider = !prevMsg || getDateLabel(prevMsg.time) !== getDateLabel(msg.time);

                return (
                  <div key={msg.id}>
                    {showDateDivider && <DateDivider label={getDateLabel(msg.time)} />}
                    <MessageBubble
                      message={msg}
                      onDelete={handleDeleteMessage}
                      selectable={isSelectingMessages}
                      isSelected={selectedMessageIds.includes(msg.id)}
                      onToggleSelect={handleToggleMessageSelect}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )
        ) : activeTab === 'file' ? (
          <p className="text-sm text-fg-tertiary">파일 목록 준비 중이에요.</p>
        ) : (
          <p className="text-sm text-fg-tertiary">AI 회의록 목록 준비 중이에요.</p>
        )}
      </MainPanel>
    </div>
  );
};
