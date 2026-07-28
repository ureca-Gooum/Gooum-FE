import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

interface ListPanelProps {
  header: ReactNode;
  children: ReactNode;
  headerHeight?: number;
  isSidebarOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 320;

export function ListPanel({ header, children, headerHeight, isSidebarOpen = false, onClose, className = '' }: ListPanelProps) {
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
    <>
      {/* 모바일 환경: 사이드바 뒷 배경 오버레이 (drawer 모드일 때만) */}
      {isSidebarOpen && onClose && (
        <div className="absolute inset-0 bg-black/20 z-30 @md:hidden" onClick={onClose} />
      )}

      {/* 
        모바일/데스크탑 모두 일반적인 flex 레이아웃으로 동작하도록 수정 
        (ChatPage, NotificationsPage에서 className을 통해 hidden/flex 처리함)
      */}
      <section
        className={`relative z-40 h-full shrink-0 flex-col bg-bg-canvas border-r border-border-default transition-transform duration-300 w-full @md:w-[var(--panel-width)] ${className}`}
        style={{ '--panel-width': `${width}px` } as React.CSSProperties}
      >
        {headerHeight ? (
          <div
            className="flex shrink-0 items-center border-b border-border-default px-4"
            style={{ height: headerHeight }}>
            {header}
          </div>
        ) : (
          <div className="shrink-0">{header}</div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        <div
          onMouseDown={handleResizeStart}
          className={`absolute -right-[3px] bottom-0 top-0 w-1.5 cursor-col-resize transition-colors hover:bg-brand-primary/30 hidden @md:block ${
            isDragging ? 'bg-brand-primary/30' : ''
          }`}
        />
      </section>
    </>
  );
}
