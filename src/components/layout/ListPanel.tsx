import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

interface ListPanelProps {
  header: ReactNode;
  children: ReactNode;
  isSidebarOpen?: boolean;
  onClose?: () => void;
  headerHeight?: number;
  className?: string;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 320;

export function ListPanel({ header, children, isSidebarOpen = false, onClose, headerHeight, className }: ListPanelProps) {
  // 오른쪽 가장자리를 드래그해서 너비를 조절할 수 있게 한다. (MIN_WIDTH ~ MAX_WIDTH 사이로 제한)
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const dragStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <>
      <section 
        className={`z-40 h-full shrink-0 flex-col bg-bg-canvas border-r border-border-default flex w-full @md:w-auto transition-transform duration-300 ${className || ''}`}
        style={{ width: isMobile ? '100%' : width }}
      >
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
          <div className="absolute -right-3 w-3 bg-border-default @md:block hidden" style={{ top: headerHeight - 1, height: 1 }} />
        )}

        <div
          onMouseDown={handleResizeStart}
          className={`absolute -right-[9px] bottom-0 top-0 w-1.5 cursor-col-resize transition-colors hover:bg-brand-primary/30 @md:block hidden ${
            isDragging ? 'bg-brand-primary/30' : ''
          }`}
        />
      </section>
    </>
  );
}
