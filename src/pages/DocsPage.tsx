import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsHeader } from '@/components/docs/DocsHeader';
import { DocsEditor } from '@/components/DocsEditor';
import { DocsEditorSkeleton } from '@/components/DocsEditorSkeleton';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AiMinutesModal } from '@/components/AiMinutesModal';
import { useDocsPage } from '@/hooks/useDocsPage';

export const DocsPage = () => {
  const {
    isSidebarOpen, setIsSidebarOpen,
    currentUser,
    aiSummaryRoomId, aiSummaryMessages,
    setFiles,
    activeFileId,
    searchQuery, setSearchQuery,
    isLoading,
    isAiMinutesOpen, setIsAiMinutesOpen,
    activeFile, filteredFiles,
    initialContent, isContentLoading,
    editorRef,
    activeUsers, setActiveUsers,
    isSaving, setIsSaving,
    toastMessage, setToastMessage,
    showExportMenu, setShowExportMenu,
    offlineMembers,
    editingTitleId, setEditingTitleId,
    titleInputRef,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen,
    alertMessage, setAlertMessage,
    handleMinutesCreated, handleTabSwitch,
    handleExportTXT, handleExportPDF,
    handleAddFile, startEditing, handleTitleChange, finishEditing,
    handleDeleteFileClick, confirmDeleteFile, navigate,
  } = useDocsPage();

  return (
    /* ── 최외곽: Docs.png 연회색 배경 ── */
    <div className="relative flex flex-1 min-w-0 min-h-0 h-full w-full flex-col bg-bg-canvas p-3 pb-4 font-sans">
      {/* ── 메인 카드 ── */}
      <div className="relative flex flex-1 overflow-hidden rounded-2xl bg-bg-default shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        {/* ── 모바일 사이드바 오버레이 ── */}
        {isSidebarOpen && (
          <div className="absolute inset-0 bg-black/20 z-30 @md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* ━━━ 좌측 사이드바 ━━━ */}
        <DocsSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleAddFile={handleAddFile}
          setIsAiMinutesOpen={setIsAiMinutesOpen}
          filteredFiles={filteredFiles}
          isLoading={isLoading}
          activeFileId={activeFileId}
          handleTabSwitch={handleTabSwitch}
          editingTitleId={editingTitleId}
          titleInputRef={titleInputRef}
          handleTitleChange={handleTitleChange}
          finishEditing={finishEditing}
          startEditing={startEditing}
          handleDeleteFileClick={handleDeleteFileClick}
        />

        {/* ━━━ 우측 메인 에디터 ━━━ */}
        <main className="flex flex-1 flex-col overflow-hidden bg-bg-default">
          {activeFile ? (
            <>
              {/* 상단 헤더바 */}
              <DocsHeader
                activeFile={activeFile}
                setIsSidebarOpen={setIsSidebarOpen}
                editingTitleId={editingTitleId}
                titleInputRef={titleInputRef}
                startEditing={startEditing}
                handleTitleChange={handleTitleChange}
                finishEditing={finishEditing}
                activeUsers={activeUsers}
                offlineMembers={offlineMembers}
                isSaving={isSaving}
                showExportMenu={showExportMenu}
                setShowExportMenu={setShowExportMenu}
                handleExportPDF={handleExportPDF}
                handleExportTXT={handleExportTXT}
              />

              {/* 에디터 본문 */}
              <div
                className="flex-1 cursor-text overflow-y-auto px-16 py-10"
                onClick={() => editorRef.current?.focus()}>
                <div className="mx-auto max-w-[720px]">
                  {/* 큰 제목 */}
                  {editingTitleId === `main-${activeFile.documentId}` ? (
                    <input
                      type="text"
                      value={activeFile.title}
                      onChange={(e) => handleTitleChange(activeFile.documentId, e.target.value)}
                      onBlur={() => finishEditing(activeFile.documentId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditing(activeFile.documentId);
                      }}
                      autoFocus
                      className="mb-3 w-full border-none bg-transparent text-[32px] font-bold leading-tight text-fg-primary outline-none placeholder:text-fg-disabled"
                      placeholder="새 문서"
                    />
                  ) : (
                    <h1
                      className="mb-3 cursor-text text-[32px] font-bold leading-tight text-fg-primary transition-colors hover:text-fg-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitleId(`main-${activeFile.documentId}`);
                      }}>
                      {activeFile.title || '새 문서'}
                    </h1>
                  )}

                  {/* Tiptap 에디터 (DocsEditor 컴포넌트) */}
                  {isContentLoading ? (
                    <DocsEditorSkeleton />
                  ) : (
                    <DocsEditor
                      key={activeFile.documentId}
                      ref={editorRef}
                      activeFile={activeFile}
                      initialContent={initialContent}
                      currentUser={currentUser}
                      setFiles={setFiles}
                      onActiveUsersChange={setActiveUsers}
                      onIsSavingChange={setIsSaving}
                      setToastMessage={setToastMessage}
                    />
                  )}
                </div>
              </div>
            </>
          ) : isLoading ? (
            <div className="flex-1 overflow-y-auto px-16 py-10">
              <div className="mx-auto max-w-[720px]">
                <DocsEditorSkeleton />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              문서를 선택하거나 새로 만들어주세요.
            </div>
          )}

          {/* 토스트 알림 */}
          {toastMessage && (
            <div className="pointer-events-none fixed top-5 left-1/2 z-50 -translate-x-1/2">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 shadow-lg">
                {isSaving ? (
                  <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className="text-[13px] font-medium text-gray-600">{toastMessage}</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI 회의록 생성 모달 */}
      {isAiMinutesOpen && (
        <AiMinutesModal
          roomId={aiSummaryRoomId}
          messages={aiSummaryMessages}
          onClose={() => setIsAiMinutesOpen(false)}
          onCreated={handleMinutesCreated}
          onGoToChat={() => navigate('/app')}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="문서 삭제"
        message={'정말로 이 문서를 삭제하시겠습니까?\n삭제된 문서는 복구할 수 없습니다.'}
        confirmText="삭제하기"
        cancelText="취소"
        isDestructive={true}
        onConfirm={confirmDeleteFile}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        usePortal={false}
      />

      <ConfirmModal
        isOpen={alertMessage !== null}
        title="알림"
        message={alertMessage || ''}
        confirmText="확인"
        onConfirm={() => setAlertMessage(null)}
        onCancel={() => setAlertMessage(null)}
        hideCancel={true}
        usePortal={false}
      />
    </div>
  );
};
