import { createPortal } from 'react-dom';
import type { RoomMember } from '@/types/room';

const TOOLTIP_WIDTH = 260;
const VIEWPORT_MARGIN = 12;

interface RoomMembersTooltipProps {
  anchorRect: DOMRect;
  members: RoomMember[];
}

export function RoomMembersTooltip({ anchorRect, members }: RoomMembersTooltipProps) {
  const left = Math.min(
    Math.max(anchorRect.left + anchorRect.width / 2 - TOOLTIP_WIDTH / 2, VIEWPORT_MARGIN),
    window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN,
  );
  const top = anchorRect.bottom + 8;

  return createPortal(
    <div
      style={{ position: 'fixed', top, left, width: TOOLTIP_WIDTH, zIndex: 9999 }}
      className="rounded-xl border border-border-default bg-bg-default p-3 text-center shadow-lg">
      <p className="mb-1 text-[12px] font-semibold text-fg-primary">이 채팅방의 모든 멤버 보기</p>
      <p className="text-[12px] leading-relaxed text-fg-tertiary">{members.map((m) => m.name).join(', ')}</p>
    </div>,
    document.body,
  );
}
