import { createPortal } from 'react-dom';

const TOOLTIP_MAX_WIDTH = 240;
const VIEWPORT_MARGIN = 12;

interface RoomNameTooltipProps {
  anchorRect: DOMRect;
  name: string;
}

/** 헤더가 좁아져 방 제목(h2)이 숨겨졌을 때, 그룹 아바타에 호버하면 방 이름을 보여주는 툴팁 */
export function RoomNameTooltip({ anchorRect, name }: RoomNameTooltipProps) {
  const left = Math.min(
    Math.max(anchorRect.left + anchorRect.width / 2 - TOOLTIP_MAX_WIDTH / 2, VIEWPORT_MARGIN),
    window.innerWidth - TOOLTIP_MAX_WIDTH - VIEWPORT_MARGIN,
  );
  const top = anchorRect.bottom + 8;

  return createPortal(
    <div
      style={{ position: 'fixed', top, left, maxWidth: TOOLTIP_MAX_WIDTH, zIndex: 60 }}
      className="truncate rounded-lg border border-border-default bg-bg-default px-3 py-1.5 text-center text-[12px] font-medium text-fg-primary shadow-lg">
      {name}
    </div>,
    document.body,
  );
}
