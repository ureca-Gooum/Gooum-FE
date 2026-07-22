import { useEffect, useState } from 'react';
import { Plus, Heart, MessageCircle } from 'lucide-react';
import { DateDivider } from '@/components/DateDivider';
import { ListPanel } from '@/components/layout/ListPanel';
import { MainPanel } from '@/components/layout/MainPanel';
import { MessageBubble } from '@/components/MessageBubble';
import { NewChatModal } from '@/components/NewChatModal';
import { RoomListItem } from '@/components/RoomListItem';
import { dummyMessages } from '@/data/dummyMessages';
import { fetchRooms, toggleFavorite, leaveRoom } from '@/api/rooms';
import { mapRoomFromApi } from '@/api/mappers/roomMapper';
import type { Room } from '@/types/chat';
import type { RoomApiResponse } from '@/types/room';

function getDateLabel(time: string) {
  return time.split(',')[0];
}

export const ChatPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [openMenuRoomId, setOpenMenuRoomId] = useState<string | null>(null);

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

  const favoriteRooms = rooms.filter((r) => r.isFavorite);
  const otherRooms = rooms.filter((r) => !r.isFavorite);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentMessages = dummyMessages.filter((m) => m.roomId === selectedRoomId);

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-fg-tertiary">불러오는 중...</div>;
  }

  if (error) {
    return <div className="flex flex-1 items-center justify-center text-error">{error}</div>;
  }

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
            onSelect={() => setSelectedRoomId(room.id)}
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
            onSelect={() => setSelectedRoomId(room.id)}
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
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-fg-primary">{selectedRoom.displayName}</h2>
              <button onClick={() => handleToggleFavorite(selectedRoom.id, selectedRoom.isFavorite)}>
                <Heart
                  size={18}
                  className={selectedRoom.isFavorite ? 'fill-current text-brand-primary' : 'text-fg-tertiary'}
                />
              </button>
            </div>
          ) : (
            <h2 className="text-fg-tertiary">채팅방을 선택해주세요</h2>
          )
        }
        footer={
          selectedRoom ? (
            <input
              className="w-full rounded-lg border border-border-default px-4 py-2 text-sm"
              placeholder="메시지 보내기"
            />
          ) : undefined
        }>
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
        </div>
      </MainPanel>
    </div>
  );
};
