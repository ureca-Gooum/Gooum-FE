import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

type WindowMode = 'maximized' | 'windowed' | 'minimized' | 'closed';

export const MainLayout = () => {
  const [windowMode, setWindowMode] = useState<WindowMode>('maximized');
  
  // 창 모드 위치 및 크기 상태
  const [rect, setRect] = useState(() => {
    const cw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const ch = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    const w = Math.min(1400, cw * 0.9);
    const h = ch * 0.85;
    return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
  });

  const isWindowed = windowMode === 'windowed';

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  
  const actionRef = useRef<{ startX: number, startY: number, startRect: typeof rect } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!actionRef.current) return;
      const { startX, startY, startRect } = actionRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (isDragging) {
        setRect({
          ...startRect,
          x: startRect.x + dx,
          y: startRect.y + dy
        });
      } else if (isResizing) {
        let newX = startRect.x;
        let newY = startRect.y;
        let newW = startRect.w;
        let newH = startRect.h;

        if (isResizing.includes('r')) newW = Math.max(400, startRect.w + dx);
        if (isResizing.includes('l')) {
          newW = Math.max(400, startRect.w - dx);
          newX = startRect.x + (startRect.w - newW);
        }
        if (isResizing.includes('b')) newH = Math.max(400, startRect.h + dy);
        if (isResizing.includes('t')) {
          newH = Math.max(400, startRect.h - dy);
          newY = startRect.y + (startRect.h - newH);
        }

        setRect({ x: newX, y: newY, w: newW, h: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      actionRef.current = null;
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // 마우스 포인터 스타일
      if (isDragging) document.body.style.cursor = 'move';
      else if (isResizing === 'r' || isResizing === 'l') document.body.style.cursor = 'ew-resize';
      else if (isResizing === 't' || isResizing === 'b') document.body.style.cursor = 'ns-resize';
      else if (isResizing === 'tr' || isResizing === 'bl') document.body.style.cursor = 'nesw-resize';
      else if (isResizing === 'tl' || isResizing === 'br') document.body.style.cursor = 'nwse-resize';
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const handleHeaderMouseDown = (e: ReactMouseEvent) => {
    if (!isWindowed) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsDragging(true);
    actionRef.current = { startX: e.clientX, startY: e.clientY, startRect: rect };
  };

  const handleResizeMouseDown = (e: ReactMouseEvent, edge: string) => {
    if (!isWindowed) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(edge);
    actionRef.current = { startX: e.clientX, startY: e.clientY, startRect: rect };
  };

  const ResizeHandle = ({ edge, className }: { edge: string, className: string }) => {
    if (!isWindowed) return null;
    return (
      <div 
        className={`absolute z-50 ${className}`} 
        onMouseDown={(e) => handleResizeMouseDown(e, edge)} 
      />
    );
  };

  if (windowMode === 'closed') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 bg-opacity-95">
        <div className="text-center">
          <p className="text-white/60 mb-4">Gooum 앱이 종료되었습니다.</p>
          <button 
            onClick={() => setWindowMode('maximized')} 
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
          >
            앱 다시 열기
          </button>
        </div>
      </div>
    );
  }

  if (windowMode === 'minimized') {
    return (
      <div className="flex h-screen w-screen items-end justify-center bg-gray-100 pb-8">
        <button 
          onClick={() => setWindowMode('maximized')} 
          className="px-6 py-3 bg-bg-default shadow-2xl rounded-2xl border border-border-default font-bold text-brand-primary flex items-center gap-3 hover:scale-105 transition-transform"
        >
          <img src="/favicon.svg" alt="logo" className="w-6 h-6 animate-pulse" />
          구움 앱 열기
        </button>
      </div>
    );
  }

  const windowedStyle = isWindowed ? {
    position: 'fixed' as const,
    left: rect.x,
    top: rect.y,
    width: rect.w,
    height: rect.h,
    zIndex: 50
  } : {};

  const layoutClasses = isWindowed
    ? '@container flex flex-col bg-bg-canvas rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-border-default overflow-hidden'
    : '@container flex h-screen w-screen flex-col overflow-hidden bg-bg-canvas transition-all duration-300';

  return (
    <div className={`transition-colors duration-300 ${isWindowed ? 'min-h-screen bg-gray-200/60 p-4 flex items-center justify-center' : ''}`}>
      <div className={layoutClasses} style={windowedStyle}>
        
        {/* 리사이즈 핸들 */}
        <ResizeHandle edge="t" className="top-0 left-0 right-0 h-1.5 cursor-n-resize -mt-0.5" />
        <ResizeHandle edge="b" className="bottom-0 left-0 right-0 h-1.5 cursor-s-resize -mb-0.5" />
        <ResizeHandle edge="r" className="top-0 bottom-0 right-0 w-1.5 cursor-e-resize -mr-0.5" />
        <ResizeHandle edge="l" className="top-0 bottom-0 left-0 w-1.5 cursor-w-resize -ml-0.5" />
        
        <ResizeHandle edge="tl" className="top-0 left-0 w-3 h-3 cursor-nw-resize -mt-1 -ml-1" />
        <ResizeHandle edge="tr" className="top-0 right-0 w-3 h-3 cursor-ne-resize -mt-1 -mr-1" />
        <ResizeHandle edge="bl" className="bottom-0 left-0 w-3 h-3 cursor-sw-resize -mb-1 -ml-1" />
        <ResizeHandle edge="br" className="bottom-0 right-0 w-3 h-3 cursor-se-resize -mb-1 -mr-1" />

        <Header 
          onMinimize={() => setWindowMode('minimized')}
          onMaximize={() => setWindowMode(isWindowed ? 'maximized' : 'windowed')}
          onClose={() => setWindowMode('closed')}
          isMaximized={!isWindowed}
          onMouseDown={handleHeaderMouseDown}
        />
        <div className="flex flex-1 overflow-hidden pt-1 pb-2.5 pr-2.5 gap-4">
          <Sidebar />
          <Outlet />
        </div>
      </div>
    </div>
  );
};
