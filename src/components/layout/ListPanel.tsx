import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

interface ListPanelProps {
  header: ReactNode;
  children: ReactNode;
  /**
   * 헤더 높이(px)를 고정하고 싶을 때 지정한다. (예: 메인패널 헤더와 높이를 맞춰서
   * 헤더 아래 보더가 정확히 같은 줄에서 이어지도록)
   * 지정하면 ListPanel과 메인패널 사이 gap 구간까지 보더 선을 이어 그려준다.
   */
  headerHeight?: number;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 320;

export function ListPanel({ header, children, headerHeight }: ListPanelProps) {
  // 오른쪽 가장자리를 드래그해서 너비를 조절할 수 있게 한다. (MIN_WIDTH ~ MAX_WIDTH 사이로 제한)
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartRef.current.startWidth + dx));
      setWidth(next);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    // 드래그 중엔 커서를 고정하고, 텍스트가 드래그되며 선택되는 걸 막는다.
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleResizeStart = (e: ReactMouseEvent) => {
    e.preventDefault();
    dragStartRef.current = { startX: e.clientX, startWidth: width };
    setIsDragging(true);
  };

  return (
    <section className="relative flex shrink-0 flex-col bg-bg-canvas" style={{ width }}>
      {headerHeight ? (
        <div
          className="flex shrink-0 items-center border-b border-border-default px-4"
          style={{ height: headerHeight }}>
          {header}
        </div>
      ) : (
        <div className="border-b border-border-default p-4">{header}</div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* 헤더 높이가 고정된 경우, 그 보더가 gap 너머 메인패널까지 끊기지 않고 이어지도록 다리를 놓는다. */}
      {headerHeight && (
        <div className="absolute -right-3 w-3 bg-border-default" style={{ top: headerHeight - 1, height: 1 }} />
      )}

      <div
        onMouseDown={handleResizeStart}
        className={`absolute -right-[9px] bottom-0 top-0 w-1.5 cursor-col-resize transition-colors hover:bg-brand-primary/30 ${
          isDragging ? 'bg-brand-primary/30' : ''
        }`}
      />
    </section>
  );
}
