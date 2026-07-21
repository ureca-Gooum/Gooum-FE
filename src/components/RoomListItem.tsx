import { Avatar } from '@/components/Avatar';
import type { Room } from '@/types/chat';

export function RoomListItem({ room }: { room: Room }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-bg-pressed cursor-pointer">
      <Avatar seed={room.id} presence={room.presence} alt={room.userName} size={40} />
      <div className="flex-1 min-w-0">
        {/* truncate 말줄임표 */}
        <p className="font-medium text-fg-primary truncate">{room.userName}</p>
        <p className="text-sm text-fg-tertiary truncate">{room.lastMessage}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-fg-tertiary">{room.lastMessageTime}</span>
        {room.unreadCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] text-white">
            {room.unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}
