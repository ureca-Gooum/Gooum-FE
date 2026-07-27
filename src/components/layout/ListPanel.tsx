import type { ReactNode } from 'react';

interface ListPanelProps {
  header: ReactNode;
  children: ReactNode;
  isSidebarOpen?: boolean;
  onClose?: () => void;
}

export function ListPanel({ header, children, isSidebarOpen = false, onClose }: ListPanelProps) {
  return (
    <>
      {/* 모바일 환경: 사이드바 뒷 배경 오버레이 */}
      {isSidebarOpen && onClose && (
        <div className="absolute inset-0 bg-black/20 z-30 @md:hidden" onClick={onClose} />
      )}
      
      {/* 
        모바일(@md 미만): absolute로 띄우고 translate로 슬라이드 처리 
        데스크탑(@md 이상): relative로 띄우고 항상 보임
      */}
      <section className={`absolute z-40 h-full w-[320px] min-w-[280px] shrink-0 flex-col bg-bg-canvas border-r border-border-default shadow-lg transition-transform duration-300 @md:relative @md:flex @md:translate-x-0 @md:shadow-none ${
        isSidebarOpen ? 'translate-x-0 flex' : '-translate-x-full flex'
      }`}>
        <div className="border-b border-border-default p-4">{header}</div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </section>
    </>
  );
}
