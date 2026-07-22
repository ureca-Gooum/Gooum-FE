// src/components/layout/Header.tsx
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center bg-bg-canvas px-3">
      {/* 왼쪽: 로고 */}
      <img src="/favicon.svg" alt="구움" className="h-10 w-10" />

      <div className="flex flex-1 items-center justify-center gap-2">
        <button className="rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button className="rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle" onClick={() => navigate(1)}>
          <ChevronRight size={18} />
        </button>

        <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-border-default bg-bg-default px-3 py-1.5">
          <Search size={16} className="text-fg-tertiary" />
          <input
            placeholder="검색"
            className="w-full bg-transparent text-sm outline-none placeholder:text-fg-tertiary"
          />
        </div>
      </div>

      <div className="h-7 w-7" />
    </header>
  );
}
