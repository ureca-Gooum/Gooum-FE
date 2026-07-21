// src/pages/DocsPage.tsx
import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import axiosInstance from '@/api/axiosInstance';

const userColors = ['#958DF1', '#F98181', '#FBCE76', '#8AE234', '#3498DB'];
const userNames = ['ㅇㅇ1', 'ㅇㅇ2', 'ㅇㅇ3', 'ㅇㅇ4', 'ㅇㅇ5'];

const getRandomItem = (array: string[]) => array[Math.floor(Math.random() * array.length)];
const currentUser = {
  name: getRandomItem(userNames),
  color: getRandomItem(userColors),
};

/* ── 파일(문서) 하나를 표현하는 타입 ── */
interface DocFile {
  id: string;
  title: string;
  roomName: string;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const DocsPage = () => {
  /* ── 파일 목록 상태 ── */
  const [files, setFiles] = useState<DocFile[]>(() => {
    let savedFiles: DocFile[] = [];
    const saved = localStorage.getItem('gooum_doc_files');
    if (saved) {
      try {
        savedFiles = JSON.parse(saved);
      } catch {
        /* ignore */
      }
    }
    if (savedFiles.length === 0) {
      savedFiles = [
        {
          id: generateId(),
          title: 'Untitled',
          roomName: 'gooum-docs-room',
        },
      ];
    }

    const urlRoom = new URLSearchParams(window.location.search).get('room');
    if (urlRoom && !savedFiles.find((f) => f.roomName === urlRoom)) {
      savedFiles.push({
        id: generateId(),
        title: 'Shared Document',
        roomName: urlRoom,
      });
    }

    return savedFiles;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    const urlRoom = new URLSearchParams(window.location.search).get('room');
    if (urlRoom) {
      const match = files.find((f) => f.roomName === urlRoom);
      if (match) return match.id;
    }
    return files[0].id;
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('gooum_doc_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    const current = files.find((f) => f.id === activeFileId) ?? files[0];
    if (current) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', current.roomName);
      window.history.replaceState(null, '', url.toString());
    }
  }, [activeFileId, files]);

  const activeFile = files.find((f) => f.id === activeFileId) ?? files[0];
  const filteredFiles = files.filter((f) => f.title.toLowerCase().includes(searchQuery.toLowerCase()));

  /* ── Yjs + WebSocket Provider ── */
  const [docState, setDocState] = useState<{
    ydoc: Y.Doc;
    provider: WebsocketProvider;
  } | null>(null);

  const wsUrl = import.meta.env.PROD ? 'wss://app-gooum-backend.azurewebsites.net/' : 'ws://localhost:8000';

  useEffect(() => {
    const doc = new Y.Doc();
    const prov = new WebsocketProvider(wsUrl, activeFile.roomName, doc);

    setDocState({ ydoc: doc, provider: prov });

    return () => {
      prov.destroy();
      doc.destroy();
    };
  }, [activeFile.roomName]);

  /* ── 활성 접속자 상태 ── */
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!docState?.provider) return;

    const updateUsers = () => {
      const states = Array.from(docState.provider.awareness.getStates().values());
      const users = states.map((state: any) => state.user).filter((u) => u && u.name);

      // 이름 기준으로 중복 제거 (여러 탭 띄운 경우 방지)
      const uniqueUsers = users.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
      setActiveUsers(uniqueUsers);
    };

    docState?.provider.awareness.on('update', updateUsers);
    updateUsers();

    return () => {
      docState?.provider.awareness.off('update', updateUsers);
    };
  }, [docState?.provider]);

  /* ── 에디터 ── */
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ undoRedo: false }),
        ...(docState
          ? [
              Collaboration.configure({ document: docState.ydoc }),
              CollaborationCaret.configure({
                provider: docState.provider,
                user: currentUser,
              }),
            ]
          : []),
        Placeholder.configure({
          placeholder: '입력하기 시작하세요...',
        }),
      ],
      content: '',
      editorProps: {
        attributes: {
          class: 'docs-editor-body',
        },
      },
    },
    [docState],
  );

  /* ── 저장 ── */
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    setToastMessage('저장 중...');
    try {
      const contentHTML = editor.getHTML();
      const contentText = editor.getText();
      const contentJSON = JSON.stringify(editor.getJSON());
      localStorage.setItem('gooum_doc_content', contentHTML);
      await axiosInstance.post('/docs/save', {
        html: contentHTML,
        text: contentText,
        json: contentJSON,
        updatedAt: new Date().toISOString(),
      });
      setToastMessage('문서가 성공적으로 저장되었습니다!');
    } catch (error) {
      console.warn('API 저장 실패 (로컬 스토리지에 임시 저장됨):', error);
      setToastMessage('저장 완료! (서버 연결 실패로 로컬에 임시 저장됨)');
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  /* ── 파일 추가 ── */
  const handleAddFile = () => {
    const newFile: DocFile = {
      id: generateId(),
      title: 'Untitled',
      roomName: `gooum-docs-${generateId()}`,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  /* ── 제목 수정 ── */
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (id: string) => {
    setEditingTitleId(id);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, title: newTitle } : f)));
  };

  const finishEditing = () => setEditingTitleId(null);

  /* ── 파일 삭제 ── */
  const handleDeleteFile = (id: string) => {
    if (files.length <= 1) return;
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    if (activeFileId === id) setActiveFileId(next[0].id);
  };

  if (!editor) return <div className="flex h-full w-full items-center justify-center text-gray-400">로딩 중...</div>;

  return (
    /* ── 최외곽: Docs.png 연회색 배경 ── */
    <div className="relative flex h-full w-full flex-col bg-[#eef1f6] p-3 pb-4 font-sans">
      {/* "Docs" 라벨 */}
      <span className="mb-2 pl-1 text-[13px] font-semibold text-blue-500">Docs</span>

      {/* ── 메인 카드 ── */}
      <div className="flex flex-1 overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        {/* ━━━ 좌측 사이드바 ━━━ */}
        <aside className="flex w-[260px] min-w-[260px] flex-col border-r border-gray-200 bg-gradient-to-b from-[#eef4ff] to-[#f5f8ff]">
          {/* Gooum 타이틀 */}
          <div className="px-5 pt-5 pb-3">
            <span className="text-base font-bold text-slate-800">Gooum</span>
          </div>

          {/* 검색바 + 필터 + 추가 */}
          <div className="flex items-center gap-1 px-3 pb-2.5">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-[7px]">
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
                className="w-full border-none bg-transparent text-[13px] text-gray-600 outline-none placeholder:text-gray-400"
              />
            </div>
            {/* 필터 아이콘 */}
            <button
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-black/5"
              title="필터">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
            </button>
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
          </div>

          {/* 파일 목록 */}
          <nav className="flex-1 overflow-y-auto px-2 py-0.5">
            {filteredFiles.length === 0 && (
              <p className="py-6 text-center text-xs text-gray-400">검색 결과가 없습니다</p>
            )}
            {filteredFiles.map((file) => {
              const isActive = file.id === activeFileId;
              const isEditing = editingTitleId === file.id;

              return (
                <div
                  key={file.id}
                  className={`group relative mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2.5 text-[13px] transition-colors select-none ${
                    isActive ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                  onClick={() => {
                    if (!isEditing) setActiveFileId(file.id);
                  }}>
                  {/* 왼쪽 파란 바 (활성 시) */}
                  <div
                    className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm transition-colors ${
                      isActive ? 'bg-blue-500' : 'bg-transparent'
                    }`}
                  />

                  {/* 문서 아이콘 */}
                  <span className="ml-1 shrink-0 text-sm">{isActive ? '🌐' : '📄'}</span>

                  {/* 제목 */}
                  {isEditing ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={file.title}
                      onChange={(e) => handleTitleChange(file.id, e.target.value)}
                      onBlur={finishEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditing();
                      }}
                      className="flex-1 rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[13px] outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={`flex-1 truncate ${isActive ? 'font-medium text-slate-800' : 'text-slate-500'}`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditing(file.id);
                      }}
                      title="더블클릭하여 제목 수정">
                      {file.title || 'Untitled'}
                    </span>
                  )}

                  {/* 우측: 사용자 아바타 (활성) or 삭제 */}
                  {isActive && !isEditing && (
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{
                        backgroundColor: currentUser.color,
                      }}>
                      {currentUser.name.charAt(0)}
                    </span>
                  )}
                  {files.length > 1 && !isEditing && !isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:text-red-500 group-hover:flex"
                      title="삭제">
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </nav>

          {/* 사이드바 하단 - 휴지통 */}
          <div className="flex items-center gap-2 border-t border-gray-200 px-5 py-3.5">
            <svg
              className="h-3.5 w-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span className="text-[13px] text-gray-400">휴지통</span>
          </div>
        </aside>

        {/* ━━━ 우측 메인 에디터 ━━━ */}
        <main className="flex flex-1 flex-col overflow-hidden bg-white">
          {/* 상단 헤더바 */}
          <header className="flex min-h-[48px] items-center justify-between border-b border-gray-100 px-5 py-2.5">
            {/* 왼쪽: 문서 제목 */}
            <div className="flex items-center">
              {editingTitleId === `header-${activeFile.id}` ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={activeFile.title}
                  onChange={(e) => handleTitleChange(activeFile.id, e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing();
                  }}
                  className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-sm font-medium outline-none"
                />
              ) : (
                <button
                  onClick={() => startEditing(`header-${activeFile.id}`)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
                  {activeFile.title || 'Untitled'}
                  <svg
                    className="h-3 w-3 text-gray-400"
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
              <div className="flex items-center -space-x-2">
                {activeUsers.map((u, i) => (
                  <div
                    key={i}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white ring-2 ring-white transition-transform hover:z-10 hover:scale-110"
                    style={{ backgroundColor: u.color }}
                    title={u.name}>
                    {u.name.charAt(0)}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#4f8ef7] to-[#6c7bfa] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(79,142,247,0.3)] transition-all hover:shadow-[0_4px_12px_rgba(79,142,247,0.4)] active:scale-95 disabled:opacity-60">
                {isSaving && (
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity="0.3" />
                    <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                저장
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </header>

          {/* 에디터 본문 */}
          <div className="flex-1 cursor-text overflow-y-auto px-16 py-10" onClick={() => editor.commands.focus()}>
            <div className="mx-auto max-w-[720px]">
              {/* 큰 제목 (Untitled) */}
              {editingTitleId === `main-${activeFile.id}` ? (
                <input
                  type="text"
                  value={activeFile.title}
                  onChange={(e) => handleTitleChange(activeFile.id, e.target.value)}
                  onBlur={() => setEditingTitleId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingTitleId(null);
                  }}
                  autoFocus
                  className="mb-3 w-full border-none bg-transparent text-[32px] font-bold leading-tight text-slate-800 outline-none placeholder:text-gray-300"
                  placeholder="Untitled"
                />
              ) : (
                <h1
                  className="mb-3 cursor-text text-[32px] font-bold leading-tight text-slate-800 transition-colors hover:text-slate-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTitleId(`main-${activeFile.id}`);
                  }}>
                  {activeFile.title || 'Untitled'}
                </h1>
              )}

              {/* Tiptap 에디터 */}
              <EditorContent editor={editor} />
            </div>
          </div>

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
    </div>
  );
};
