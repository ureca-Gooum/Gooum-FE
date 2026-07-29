import { useState, useEffect } from 'react';
import { Menu, ChevronDown, Download, FileText, FileCode, Loader2 } from 'lucide-react';
import type { Document } from '@/types/document';

interface DocsHeaderProps {
  activeFile: Document;
  setIsSidebarOpen: (open: boolean) => void;
  editingTitleId: string | null;
  startEditing: (id: string) => void;
  handleTitleChange: (id: string, newTitle: string) => void;
  finishEditing: (id: string) => void;
  activeUsers: any[];
  offlineMembers: any[];
  isSaving: boolean;
  handleExportPDF: () => void;
  handleExportTXT: () => void;
}

export const DocsHeader = ({
  activeFile,
  setIsSidebarOpen,
  editingTitleId,
  startEditing,
  handleTitleChange,
  finishEditing,
  activeUsers,
  offlineMembers,
  isSaving,
  handleExportPDF,
  handleExportTXT,
}: DocsHeaderProps) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && !(e.target as Element).closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  return (
    <header className="flex min-h-[48px] items-center justify-between border-b border-border-default px-5 py-2.5">
      {/* 왼쪽: 햄버거 메뉴 + 문서 제목 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="@md:hidden flex items-center justify-center rounded-md p-1.5 text-fg-secondary hover:bg-bg-subtle active:scale-95">
          <Menu className="h-5 w-5" />
        </button>
        {editingTitleId === `header-${activeFile.documentId}` ? (
          <input
            type="text"
            value={activeFile.title}
            onChange={(e) => handleTitleChange(activeFile.documentId, e.target.value)}
            onBlur={() => finishEditing(activeFile.documentId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishEditing(activeFile.documentId);
            }}
            autoFocus
            onFocus={(e) => e.target.select()}
            className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-sm font-medium outline-none"
          />
        ) : (
          <button
            onClick={() => startEditing(`header-${activeFile.documentId}`)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-fg-secondary transition-colors hover:bg-bg-subtle">
            <span className="hidden @md:inline">{activeFile.title || '새 문서'}</span>
            <span className="@md:hidden text-left">
              {(activeFile.title || '새 문서').length > 6
                ? (activeFile.title || '새 문서').slice(0, 6) + '...'
                : activeFile.title || '새 문서'}
            </span>
            <svg
              className="h-3 w-3 text-gray-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {/* 가운데 공간 비우기 */}
      <div className="flex-1" />

      {/* 오른쪽: 접속자 아바타 그룹 + 저장 버튼 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center -space-x-2" data-tour="doc-collaborators">
          {[
            ...activeUsers.map((u) => ({ ...u, isOnline: true })),
            ...offlineMembers,
          ].map((u, i) => (
            <div
              key={u.userId || u.id || u.name || i}
              className={`group relative flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white ring-2 ring-[var(--color-bg-default)] transition-all hover:z-30 hover:scale-110 flex-shrink-0 ${
                u.isOnline ? 'z-10' : 'opacity-60 saturate-75'
              }`}
              style={{ backgroundColor: u.color || 'var(--color-avatar-1)' }}>
              <span>{u.name?.charAt(0)}</span>
              {u.avatar && (
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="absolute inset-0 h-full w-full rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
              {u.isOnline && (
                <div className="absolute inset-0 rounded-full ring-2 ring-[var(--color-presence-online)] ring-offset-1 ring-offset-[var(--color-bg-default)] pointer-events-none" />
              )}
              <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-fg-primary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-bg-default)] shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1 z-40 flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    u.isOnline ? 'bg-[var(--color-presence-online)]' : 'bg-[var(--color-fg-disabled)]'
                  }`}
                />
                <span>{u.name}</span>
                <span className="text-[10px] opacity-75">{u.isOnline ? '이 문서 참여 중' : '미참여'}</span>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-b-4 border-b-[var(--color-fg-primary)]" />
              </div>
            </div>
          ))}
        </div>

        <div className="relative flex items-center export-menu-container">
          {/* PC 내보내기 버튼 */}
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isSaving}
            className="hidden @md:flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#4f8ef7] to-[#6c7bfa] px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(79,142,247,0.3)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
            title="내보내기 옵션">
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>내보내기</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {/* 모바일 다운로드(내보내기) 버튼 */}
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isSaving}
            className="flex @md:hidden items-center justify-center h-8 w-8 rounded-md text-fg-secondary hover:bg-bg-subtle transition-colors active:scale-95 disabled:opacity-60"
            title="내보내기">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-[110%] w-32 rounded-lg border border-[var(--color-border-default,#e5e7eb)] bg-[var(--color-bg-default,#ffffff)] p-1 shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-50">
              <button
                onClick={() => {
                  handleExportPDF();
                  setShowExportMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] font-medium text-[var(--color-fg-primary,#111827)] transition-colors hover:bg-[var(--color-bg-subtle,#f3f4f6)] hover:text-blue-600">
                <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span>PDF로 저장</span>
              </button>
              <button
                onClick={() => {
                  handleExportTXT();
                  setShowExportMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] font-medium text-[var(--color-fg-primary,#111827)] transition-colors hover:bg-[var(--color-bg-subtle,#f3f4f6)] hover:text-blue-600">
                <FileCode className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                <span>TXT로 저장</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
