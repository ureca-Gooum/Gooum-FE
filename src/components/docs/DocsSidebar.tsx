import { motion } from 'framer-motion';
import { Sparkles, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import type { Document } from '@/types/document';

interface DocsSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleAddFile: () => void;
  setIsAiMinutesOpen: (open: boolean) => void;
  filteredFiles: Document[];
  isLoading: boolean;
  activeFileId: string | null;
  handleTabSwitch: (id: string) => void;
  editingTitleId: string | null;
  startEditing: (id: string) => void;
  handleTitleChange: (id: string, newTitle: string) => void;
  finishEditing: (id: string) => void;
  handleDeleteFileClick: (id: string) => void;
}

export const DocsSidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  searchQuery,
  setSearchQuery,
  handleAddFile,
  setIsAiMinutesOpen,
  filteredFiles,
  isLoading,
  activeFileId,
  handleTabSwitch,
  editingTitleId,
  startEditing,
  handleTitleChange,
  finishEditing,
  handleDeleteFileClick,
}: DocsSidebarProps) => {
  return (
    <>
      {/* ── 모바일 사이드바 오버레이 ── */}
      {isSidebarOpen && (
        <div className="absolute inset-0 bg-black/20 z-30 @md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ━━━ 좌측 사이드바 ━━━ */}
      <aside
        className={`absolute z-40 h-full w-[260px] flex-col border-r border-border-default bg-bg-canvas shadow-lg transition-transform duration-300 @md:relative @md:flex @md:translate-x-0 @md:shadow-none ${
          isSidebarOpen ? 'translate-x-0 flex' : '-translate-x-full flex'
        }`}>
        {/* Gooum 타이틀 */}
        <div className="px-5 pt-5 pb-3">
          <span className="text-base font-bold text-fg-primary">문서</span>
        </div>

        {/* 검색바 + 필터 + 추가 */}
        <div className="flex items-center gap-1 px-3 pb-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-default bg-bg-default px-2.5 py-[7px]">
            {/* 🔍 아이콘 */}
            <svg
              className="h-3.5 w-3.5 shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-none bg-transparent text-[13px] text-fg-primary outline-none placeholder:text-fg-tertiary"
            />
          </div>
          {/* + 버튼 */}
          <button
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-black/5 hover:text-blue-500"
            title="새 문서 추가"
            onClick={handleAddFile}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          {/* AI 회의록 생성 버튼 */}
          <button
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-black/5 hover:text-blue-500"
            title="AI 회의록 생성"
            onClick={() => setIsAiMinutesOpen(true)}>
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 파일 목록 */}
        <nav className="flex-1 overflow-y-auto px-2 py-0.5">
          {filteredFiles.length === 0 && isLoading && (
            <div className="flex flex-col gap-1 py-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-2.5">
                  <Skeleton className="h-4 w-4 shrink-0 rounded" />
                  <Skeleton className="h-3.5 w-2/3 rounded-full" />
                </div>
              ))}
            </div>
          )}
          {filteredFiles.length === 0 && !isLoading && (
            <p className="py-6 text-center text-xs text-gray-400">문서가 없습니다</p>
          )}
          {filteredFiles.map((file) => {
            const isActive = file.documentId === activeFileId;
            const isEditing = editingTitleId === file.documentId;

            return (
              <div
                key={file.documentId}
                className={`group relative mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2.5 text-[13px] transition-colors select-none ${
                  isActive ? 'bg-[var(--color-bg-default)]' : 'hover:bg-[var(--color-bg-subtle)]'
                }`}
                onClick={() => {
                  if (!isEditing) {
                    handleTabSwitch(file.documentId);
                    setIsSidebarOpen(false); // 모바일에서 선택 시 닫기
                  }
                }}>
                {isActive && (
                  <motion.div
                    layoutId="docsSidebarIndicator"
                    transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
                    className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-[var(--color-brand-primary)]"
                  />
                )}

                {/* 제목 영역 */}
                {isEditing ? (
                  <input
                    type="text"
                    value={file.title}
                    onChange={(e) => handleTitleChange(file.documentId, e.target.value)}
                    onBlur={() => finishEditing(file.documentId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEditing(file.documentId);
                    }}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    className="flex-1 rounded border border-[var(--color-border-brand)] bg-[var(--color-brand-soft)] px-1.5 py-0.5 text-[13px] outline-none text-[var(--color-fg-primary)]"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={`flex-1 truncate ${
                      isActive ? 'font-medium text-[var(--color-fg-primary)]' : 'text-[var(--color-fg-secondary)]'
                    }`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditing(file.documentId);
                    }}
                    title="더블클릭하여 제목 수정">
                    {file.title || '새 문서'}
                  </span>
                )}

                {/* 우측: 삭제 버튼 (편집 중이 아닐 때, 호버하거나 활성 상태면 노출) */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFileClick(file.documentId);
                    }}
                    className={`h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-pressed)] hover:text-[var(--color-error)] transition-colors ${
                      isActive ? 'flex' : 'hidden group-hover:flex'
                    }`}
                    title="삭제">
                    {/* Lucide Trash2 아이콘 */}
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
