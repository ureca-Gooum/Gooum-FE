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

  const isWindowed = windowMode === 'windowed';

  const layoutClasses = isWindowed
    ? '@container flex flex-col bg-bg-canvas h-[85vh] w-[90vw] max-w-[1400px] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-border-default overflow-hidden m-auto transition-all duration-300'
    : '@container flex h-screen w-screen flex-col overflow-hidden bg-bg-canvas transition-all duration-300';

  return (
    <div className={`transition-colors duration-300 ${isWindowed ? 'min-h-screen bg-gray-200/60 p-4 flex items-center justify-center' : ''}`}>
      <div className={layoutClasses}>
        <Header 
          onMinimize={() => setWindowMode('minimized')}
          onMaximize={() => setWindowMode(isWindowed ? 'maximized' : 'windowed')}
          onClose={() => setWindowMode('closed')}
          isMaximized={!isWindowed}
        />
        <div className="flex flex-1 overflow-hidden pt-1 pb-2.5 pr-2.5 gap-4">
          <Sidebar />
          <Outlet />
        </div>
      </div>
    </div>
  );
};
