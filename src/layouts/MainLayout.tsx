import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

type WindowMode = 'maximized' | 'windowed' | 'minimized' | 'closed';

export const MainLayout = () => {
  const [windowMode, setWindowMode] = useState<WindowMode>('maximized');

  if (windowMode === 'closed') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 bg-opacity-95">
        <div className="text-center">
          <p className="mb-4 text-white/60">Gooum 앱이 종료되었습니다.</p>

          <button
            onClick={() => setWindowMode('maximized')}
            className="rounded-lg bg-brand-primary px-6 py-2 text-white transition-colors hover:bg-brand-primary/90">
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
          className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-default px-6 py-3 font-bold text-brand-primary shadow-2xl transition-transform hover:scale-105">
          <img src="/favicon.svg" alt="logo" className="h-6 w-6 animate-pulse" />
          구움 앱 열기
        </button>
      </div>
    );
  }

  const isWindowed = windowMode === 'windowed';

  const layoutClasses = isWindowed
    ? `
        flex h-[85vh] w-[90vw] max-w-[1400px] min-w-[900px]
        flex-col overflow-hidden rounded-xl
        border border-border-default bg-bg-canvas
        shadow-[0_0_40px_rgba(0,0,0,0.15)]
        transition-all duration-300
      `
    : `
        flex h-screen min-w-[900px] flex-col
        overflow-hidden bg-bg-canvas
        transition-all duration-300
      `;

  return (
    <div
      className={
        isWindowed
          ? 'flex min-h-screen items-center justify-center overflow-x-auto bg-gray-200/60 p-4 transition-colors duration-300'
          : 'h-screen w-full overflow-x-auto transition-colors duration-300'
      }>
      <div className={layoutClasses}>
        <Header
          onMinimize={() => setWindowMode('minimized')}
          onMaximize={() => setWindowMode(isWindowed ? 'maximized' : 'windowed')}
          onClose={() => setWindowMode('closed')}
          isMaximized={!isWindowed}
        />

        <div className="flex min-w-0 flex-1 gap-4 overflow-hidden pb-2.5 pr-2.5 pt-1">
          <Sidebar />

          <div className="flex min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
