import { DateDivider } from '@/components/DateDivider';
import { ListPanel } from '@/components/layout/ListPanel';
import { MainPanel } from '@/components/layout/MainPanel';
import { MessageBubble } from '@/components/MessageBubble';
import { NewChatButton } from '@/components/NewChatButton';
import { RoomListItem } from '@/components/RoomListItem';
import { dummyMessages } from '@/data/dummyMessages';
import { dummyRooms } from '@/data/dummyRooms';
import { MessageCircle, Star } from 'lucide-react';

// 더미데이터 time 날짜 부분만 뽑기
function getDateLabel(time: string) {
  return time.split(',')[0];
}

export const ChatPage = () => {
  const favoriteRooms = dummyRooms.filter((r) => r.isFavorite);
  const otherRooms = dummyRooms.filter((r) => !r.isFavorite);

  const currentRoomId = '1';
  const currentMessages = dummyMessages.filter((m) => m.roomId === currentRoomId);

  return (
    // flex: 3단 구조
    <div className="flex flex-1">
      <ListPanel
        header={
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-fg-primary">채팅</h2>
            <NewChatButton onCreated={(roomId) => console.log('생성된 방: ', roomId)} />
          </div>
        }>
        <div className="flex items-center gap-1.5 px-4 pt-4">
          <Star size={14} className="text-fg-tertiary" />
          <p className="text-xs font-medium text-fg-tertiary">즐겨찾기</p>
        </div>
        {favoriteRooms.map((room) => (
          <RoomListItem key={room.id} room={room} />
        ))}

        <div className="flex items-center gap-1.5 px-4 pt-4">
          <MessageCircle size={14} className="text-fg-tertiary" />
          <p className="text-xs font-medium text-fg-tertiary">채팅</p>
        </div>
        {otherRooms.map((room) => (
          <RoomListItem key={room.id} room={room} />
        ))}
      </ListPanel>

      <MainPanel
        header={<h2 className="font-semibold text-fg-primary">Daichi Fukuda</h2>}
        footer={
          <input
            className="w-full rounded-lg border border-border-default px-4 py-2 text-sm"
            placeholder="메시지 보내기"
          />
        }>
        <div className="flex flex-col gap-3">
          {currentMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

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
