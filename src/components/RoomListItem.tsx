import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Heart, LogOut } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import type { Room } from '@/types/chat';

interface RoomListItemProps {
  room: Room;
  onSelect: () => void;
  onToggleFavorite: (roomId: string, current: boolean) => void;
  onLeave: (roomId: string) => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function RoomListItem({
  room,
  onSelect,
  onToggleFavorite,
  onLeave,
  isMenuOpen,
  onMenuToggle,
}: RoomListItemProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [hoveredItem, setHoveredItem] = useState<'favorite' | 'leave' | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 메뉴가 열릴 때마다 위치를 다시 계산 (버튼 위치 기준)
  useEffect(() => {
    if (isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isMenuOpen]);

  // 등장 트랜지션
  useEffect(() => {
    if (isMenuOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isMenuOpen]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = () => onMenuToggle();
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLeave = () => {
    onMenuToggle();
    if (!confirm(`${room.displayName}님과의 채팅방을 나가시겠어요?`)) return;
    onLeave(room.id);
  };

  const handleToggleFavorite = () => {
    onMenuToggle();
    onToggleFavorite(room.id, room.isFavorite);
  };

  const isUnread = room.unreadCount > 0;

  return (
    <div
      onClick={onSelect}
      className="group relative flex items-center gap-3 px-4 py-2 hover:bg-bg-pressed cursor-pointer">
      <Avatar
        seed={room.id}
        imageUrl={room.type === 'group' ? undefined : room.displayImage}
        presence={room.type === 'group' ? undefined : room.presence}
        memberCount={room.type === 'group' ? room.memberCount : undefined}
        alt={room.displayName}
        size={40}
      />

      <div className="flex-1 min-w-0">
        <p className={`truncate ${isUnread ? 'font-bold text-fg-primary' : 'font-medium text-fg-primary'}`}>
          {room.displayName}
        </p>
        <p className={`truncate text-sm ${isUnread ? 'font-bold text-fg-primary' : 'text-fg-tertiary'}`}>
          {room.lastMessagePreview}
        </p>
      </div>

      <div className="relative flex h-8 w-[72px] shrink-0 items-center justify-end">
        {/* 평소: 시간 + 안읽음 점 */}
        <div
          className={`absolute inset-0 flex items-center justify-end gap-2 transition-opacity duration-150 ${
            isMenuOpen ? 'pointer-events-none opacity-0' : 'group-hover:opacity-0'
          }`}>
          <span className="whitespace-nowrap text-xs text-fg-tertiary">{room.lastMessageTime}</span>
          {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fg-primary" />}
        </div>

        {/* 호버 시: 같은 자리에 메뉴 버튼만 */}
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className={`group/menubtn absolute inset-0 flex items-center justify-end rounded p-1 transition-opacity duration-150 ${
            isMenuOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
          }`}>
          <MoreVertical
            size={16}
            strokeWidth={isMenuOpen ? 2.5 : 2}
            className={`transition-colors group-hover/menubtn:text-fg-primary ${
              isMenuOpen ? 'text-fg-primary' : 'text-fg-tertiary'
            }`}
          />
        </button>
      </div>

      {createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            width: '176px',
            borderRadius: '8px',
            border: '1px solid var(--color-border-default)',
            backgroundColor: 'var(--color-bg-default)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '4px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0.98)',
            transformOrigin: 'top left',
            transition: 'opacity 0.12s ease-out, transform 0.12s ease-out',
            visibility: isMenuOpen ? 'visible' : 'hidden',
            pointerEvents: isMenuOpen ? 'auto' : 'none',
          }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite();
            }}
            onMouseEnter={() => setHoveredItem('favorite')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              borderRadius: '6px',
              padding: '10px 12px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: hoveredItem === 'favorite' ? 700 : 400,
              color: 'var(--color-fg-primary)',
            }}>
            <Heart
              size={14}
              fill={room.isFavorite ? 'currentColor' : 'none'}
              style={{
                color: room.isFavorite
                  ? 'var(--color-error)'
                  : hoveredItem === 'favorite'
                    ? 'var(--color-brand-primary)'
                    : 'var(--color-fg-secondary)',
              }}
            />
            {room.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLeave();
            }}
            onMouseEnter={() => setHoveredItem('leave')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              borderRadius: '6px',
              padding: '10px 12px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: hoveredItem === 'leave' ? 700 : 400,
              color: 'var(--color-fg-primary)',
            }}>
            <LogOut
              size={14}
              style={{
                color: hoveredItem === 'leave' ? 'var(--color-brand-primary)' : 'var(--color-fg-secondary)',
              }}
            />
            나가기
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
