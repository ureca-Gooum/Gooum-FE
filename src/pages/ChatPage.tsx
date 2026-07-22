import { useEffect, useRef, useState } from 'react';
import { Plus, Heart, MessageCircle, Sparkles, Pencil, Send } from 'lucide-react';
import { DateDivider } from '@/components/DateDivider';
import { ListPanel } from '@/components/layout/ListPanel';
import { MainPanel } from '@/components/layout/MainPanel';
import { MessageBubble } from '@/components/MessageBubble';
import { NewChatModal } from '@/components/NewChatModal';
import { RoomListItem } from '@/components/RoomListItem';
import { Avatar } from '@/components/Avatar';
import { dummyMessages } from '@/data/dummyMessages';
import { fetchRooms, toggleFavorite, leaveRoom } from '@/api/rooms';
import { mapRoomFromApi } from '@/api/mappers/roomMapper';
import type { Room, Message } from '@/types/chat';
import type { RoomApiResponse } from '@/types/room';

function getDateLabel(time: string) {
  return time.split(',')[0];
}

type PanelTab = 'chat' | 'file' | 'docs';

export const ChatPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [openMenuRoomId, setOpenMenuRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [messageText, setMessageText] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRooms()
      .then((data) => setRooms(data.rooms.map(mapRoomFromApi)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
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
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedRoomId) return;

    const newMessage: Message = {
      id: `local-${Date.now()}`,
      roomId: selectedRoomId,
      senderId: 'me',
      senderName: '나',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: messageText }] }],
      },
      time: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
      isMine: true,
    };

    setLocalMessages((prev) => [...prev, newMessage]);
    setMessageText('');
  };

  const favoriteRooms = rooms.filter((r) => r.isFavorite);
  const otherRooms = rooms.filter((r) => !r.isFavorite);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentMessages = [
    ...dummyMessages.filter((m) => m.roomId === selectedRoomId),
    ...localMessages.filter((m) => m.roomId === selectedRoomId),
  ];

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
            <div className="flex items-center gap-2">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSendMessage();
                  }
                }}
                className="flex-1 rounded-lg border border-border-default px-4 py-2 text-sm outline-none transition-shadow focus:shadow-[0_2px_0_0_var(--color-brand-primary)]"
                placeholder="메시지를 입력하세요."
              />
              <button className="rounded-md p-1.5 text-brand-primary hover:bg-bg-subtle" title="AI 회의록 생성">
                <Sparkles size={18} />
              </button>
              <button
                onClick={handleSendMessage}
                className="rounded-md p-1.5 text-brand-primary hover:bg-bg-subtle"
                title="전송">
                <Send size={18} />
              </button>
            </div>
          ) : undefined
        }>
        {activeTab === 'chat' ? (
          <div className="flex flex-col gap-3">
            {currentMessages.map((msg, index) => {
              const prevMsg = currentMessages[index - 1];
              const showDateDivider = !prevMsg || getDateLabel(prevMsg.time) !== getDateLabel(msg.time);

              return (
                <div key={msg.id}>
                  {showDateDivider && <DateDivider label={getDateLabel(msg.time)} />}
                  <MessageBubble message={msg} />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : activeTab === 'file' ? (
          <p className="text-sm text-fg-tertiary">파일 목록 준비 중이에요.</p>
        ) : (
          <p className="text-sm text-fg-tertiary">AI 회의록 목록 준비 중이에요.</p>
        )}
      </MainPanel>
    </div>
  );
};
