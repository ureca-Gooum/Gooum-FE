import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppIntroModal } from '@/components/AppIntroModal';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

type WindowMode = 'maximized' | 'windowed' | 'minimized' | 'closed';

export const MainLayout = () => {
  const location = useLocation();
  // 로그인 화면에서는 헤더(검색/창 컨트롤)와 사이드바(아이콘 레일)를 아예 안 보여준다.
  const isLoginPage = location.pathname === '/login';

  const [windowMode, setWindowMode] = useState<WindowMode>('maximized');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { startTour, hasSeenOnboarding } = useOnboardingTour();

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('accessToken');
    if (isLoggedIn && !isLoginPage && !hasSeenOnboarding()) {
      startTour();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const actionRef = useRef<{ startX: number; startY: number; startRect: typeof rect } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!actionRef.current) return;
      const { startX, startY, startRect } = actionRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newX = startRect.x;
      let newY = startRect.y;
      let newW = startRect.w;
      let newH = startRect.h;

      if (isDragging) {
        newX = startRect.x + dx;
        newY = Math.max(0, startRect.y + dy);
      } else if (isResizing) {
        if (isResizing.includes('r')) newW = Math.max(840, startRect.w + dx);
        if (isResizing.includes('l')) {
          newW = Math.max(840, startRect.w - dx);
          newX = startRect.x + (startRect.w - newW);
        }
        if (isResizing.includes('b')) newH = Math.max(911, startRect.h + dy);
        if (isResizing.includes('t')) {
          newH = Math.max(911, startRect.h - dy);
          newY = startRect.y + (startRect.h - newH);
        }
      }

      // DOM 직접 조작 (requestAnimationFrame 없이 즉각 적용하여 딜레이 0으로 만듦)
      if (windowRef.current) {
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
        windowRef.current.style.width = `${newW}px`;
        windowRef.current.style.height = `${newH}px`;
      }
    };

    const handleMouseUp = () => {
      if (actionRef.current && windowRef.current) {
        setRect({
          x: parseFloat(windowRef.current.style.left) || 0,
          y: parseFloat(windowRef.current.style.top) || 0,
          w: parseFloat(windowRef.current.style.width) || 0,
          h: parseFloat(windowRef.current.style.height) || 0,
        });
      }
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

  const ResizeHandle = ({ edge, className }: { edge: string; className: string }) => {
    if (!isWindowed) return null;
    return <div className={`absolute z-50 ${className}`} onMouseDown={(e) => handleResizeMouseDown(e, edge)} />;
  };

  if (windowMode === 'closed') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 bg-opacity-95">
        <div className="text-center">
          <p className="text-white/60 mb-4">Gooum 앱이 종료되었습니다.</p>
          <button
            onClick={() => setWindowMode('maximized')}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors">
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
          className="px-6 py-3 bg-bg-default shadow-2xl rounded-2xl border border-border-default font-bold text-brand-primary flex items-center gap-3 hover:scale-105 transition-transform">
          <img src="/GOOUM.png" alt="logo" className="w-6 h-6 animate-pulse" />
          구움 앱 열기
        </button>
      </div>
    );
  }

  const windowedStyle = isWindowed
    ? {
        position: 'fixed' as const,
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex: 50,
      }
    : {};

  const layoutClasses = isWindowed
    ? '@container flex flex-col rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-border-default overflow-hidden min-w-[840px] min-h-[911px]'
    : '@container flex h-screen w-full min-w-[840px] min-h-[911px] flex-col overflow-hidden transition-all duration-300';

  // Header/Sidebar/ListPanel은 전부 단색 bg-bg-canvas를 쓰기 때문에, 창 배경을 그라데이션으로
  // 두면 그 지점의 색이 미묘하게 달라져 패널 경계가 선처럼 보이는 문제가 있었다.
  // 동일한 단색을 그대로 써서 이 경계가 보이지 않도록 한다.
  const canvasStyle = { backgroundColor: 'var(--color-bg-canvas)' };

  return (
    <div
      className={`transition-colors duration-300 ${isWindowed ? 'min-h-screen bg-gray-200/60 p-4 flex items-center justify-center' : ''}`}>
      <div ref={windowRef} className={layoutClasses} style={{ ...windowedStyle, ...canvasStyle }}>
        {/* 리사이즈 핸들 */}
        <ResizeHandle edge="t" className="top-0 left-0 right-0 h-1.5 cursor-n-resize -mt-0.5" />
        <ResizeHandle edge="b" className="bottom-0 left-0 right-0 h-1.5 cursor-s-resize -mb-0.5" />
        <ResizeHandle edge="r" className="top-0 bottom-0 right-0 w-1.5 cursor-e-resize -mr-0.5" />
        <ResizeHandle edge="l" className="top-0 bottom-0 left-0 w-1.5 cursor-w-resize -ml-0.5" />

        <ResizeHandle edge="tl" className="top-0 left-0 w-3 h-3 cursor-nw-resize -mt-1 -ml-1" />
        <ResizeHandle edge="tr" className="top-0 right-0 w-3 h-3 cursor-ne-resize -mt-1 -mr-1" />
        <ResizeHandle edge="bl" className="bottom-0 left-0 w-3 h-3 cursor-sw-resize -mb-1 -ml-1" />
        <ResizeHandle edge="br" className="bottom-0 right-0 w-3 h-3 cursor-se-resize -mb-1 -mr-1" />

        {!isLoginPage && (
          <Header
            onMinimize={() => setWindowMode('minimized')}
            onMaximize={() => setWindowMode(isWindowed ? 'maximized' : 'windowed')}
            onClose={() => setWindowMode('closed')}
            isMaximized={!isWindowed}
            onMouseDown={handleHeaderMouseDown}
            onHelpClick={() => setShowOnboarding(true)}
          />
        )}
        <div
          className={`flex flex-col @md:flex-row flex-1 overflow-hidden @md:gap-4 ${isLoginPage ? '' : '@md:pt-2 @md:pb-6 @md:pr-5'}`}>
          {!isLoginPage && (
            <div className="order-2 @md:order-1 shrink-0 z-50 border-t border-border-default @md:border-none shadow-[0_-2px_10px_rgba(0,0,0,0.05)] @md:shadow-none h-14 @md:h-full">
              <Sidebar />
            </div>
          )}
          <div className="flex flex-1 min-h-0 order-1 @md:order-2 w-full">
            <Outlet />
          </div>
        </div>
      </div>
      {showOnboarding && (
        <AppIntroModal
          onClose={() => setShowOnboarding(false)}
          onStartTour={hasSeenOnboarding() ? undefined : startTour}
        />
      )}
      <div id="modal-root" className="absolute inset-0 z-[9999] pointer-events-none" />
    </div>
  );
};
