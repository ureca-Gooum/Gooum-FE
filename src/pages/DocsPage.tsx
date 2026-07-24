import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Menu } from 'lucide-react';
import { DocsEditor } from '@/components/DocsEditor';
import type { DocsEditorRef } from '@/components/DocsEditor';
import { AiMinutesModal } from '@/components/AiMinutesModal';
import { wrapAiMinutesContent } from '@/utils/tiptap';

import { getDocuments, getDocumentById, createDocument, saveDocument, deleteDocument } from '@/api/documents';
import type { Document } from '@/types/document';
import type { Message } from '@/types/chat';
import { connectSocket, joinRoom, sendMessage } from '@/socket/socket';
import api from '@/api/axiosInstance';

const AVATAR_COLORS = [
  'var(--color-avatar-1)',
  'var(--color-avatar-2)',
  'var(--color-avatar-3)',
  'var(--color-avatar-4)',
  'var(--color-avatar-5)',
  'var(--color-avatar-6)',
];

// 유저 ID/이름 기반으로 고유한 CSS 변수 색상을 지정해 주는 함수
const getUserColor = (idOrName: string) => {
  let hash = 0;
  for (let i = 0; i < idOrName.length; i++) {
    hash = idOrName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const DocsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 내 정보 상태 관리
  const [myProfile, setMyProfile] = useState<{ id?: string; name: string; avatar: string }>({
    id: '',
    name: '사용자',
    avatar: '',
  });

  // 1. 내 프로필 정보 불러오기 (/api/users/me)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const fetchMyProfile = async () => {
      try {
        const response = await api.get('/api/users/me');
        const data = response.data;

        setMyProfile({
          id: data.id || data.userId || '',
          name: data.name || '사용자',
          avatar: data.profileImageUrl || '',
        });
      } catch (error) {
        console.error('DocsPage 내 프로필 조회 실패:', error);
      }
    };

    fetchMyProfile();
  }, []);

  // 2. 동시 편집 및 아바타에 전달할 currentUser 생성
  const currentUser = useMemo(() => {
    return {
      name: myProfile.name,
      color: getUserColor(myProfile.name), // 이름 기반 색상 함수
      avatar: myProfile.avatar,
    };
  }, [myProfile]);

  /* ── URL 쿼리 파라미터 (채팅 페이지의 AI 회의록 버튼에서 전달됨) ── */
  const [searchParams] = useSearchParams();
  const roomIdParam = searchParams.get('room');
  // 채팅에 올라온 "문서 카드" 클릭으로 들어온 경우, 그 문서를 바로 열기 위한 ID
  const documentIdParam = searchParams.get('document');

  /* ── 채팅 페이지에서 카톡 캡쳐 방식으로 선택해온 메시지들 (navigate state) ── */
  const location = useLocation();
  const navigate = useNavigate();
  const navState = (location.state as { roomId?: string; messages?: Message[] } | null) || null;
  const aiSummaryRoomId = navState?.roomId || roomIdParam || '';
  const aiSummaryMessages = navState?.messages || [];

  /* ── 파일 목록 상태 ── */
  const [files, setFiles] = useState<Document[]>(() => {
    const cached = localStorage.getItem('gooum_cached_documents');
    return cached ? JSON.parse(cached) : [];
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('gooum_cached_documents'));

  /* ── AI 회의록 생성 모달 상태 ── */
  const [isAiMinutesOpen, setIsAiMinutesOpen] = useState(false);
  // AI가 방금 생성한 문서의 콘텐츠(박스로 감싼 버전)를 documentId별로 임시 보관.
  // 문서 조회(getDocumentById) API를 다시 타지 않고, 이미 갖고 있는 콘텐츠를 그대로 써서
  // "생성 즉시 회색 박스로 보이는" 화면을 만들기 위함.
  const pendingContentRef = useRef<Record<string, any>>({});

  // 채팅 페이지에서 메시지를 선택하고 "다음"을 눌러 넘어온 경우, 모달을 자동으로 열어줌
  useEffect(() => {
    if (navState?.messages && navState.messages.length > 0) {
      setIsAiMinutesOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 채팅 카드를 눌러 documentId가 바뀌어 들어온 경우 (이미 Docs 페이지에 있던 상태에서도 반영)
  useEffect(() => {
    if (documentIdParam && files.some((f) => f.documentId === documentIdParam)) {
      setActiveFileId(documentIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentIdParam, files]);

  const handleMinutesCreated = (doc: Document, meta: { roomId: string; title: string; transcript: string }) => {
    // 생성된 회의록 콘텐츠를 연회색 AI 박스로 한 번만 감싼다.
    // (이후 저장되면 박스 노드 자체가 문서 콘텐츠의 일부가 되어 계속 유지된다)
    const wrappedContent = wrapAiMinutesContent(doc.content, meta);
    pendingContentRef.current[doc.documentId] = wrappedContent;

    setFiles((prev) => [{ ...doc, content: wrappedContent }, ...prev]);
    setActiveFileId(doc.documentId);
    setIsAiMinutesOpen(false);

    // 채팅방에 "문서 카드" 메시지를 올려서, Teams의 Loop 카드처럼 바로 이동할 수 있게 한다.
    // Docs 페이지로 넘어오면서 ChatPage가 언마운트되어 소켓 룸에서 이미 leaveRoom된 상태다.
    // (ChatPage의 방 이동/언마운트 cleanup이 leaveRoom을 호출함) 다시 연결만 해서는
    // 이 소켓이 그 방의 브로드캐스트 대상이 아니라 내가 보낸 메시지의 echo(newMessage)를
    // 못 받으므로, sendMessage 전에 반드시 joinRoom을 다시 해줘야 한다.
    try {
      connectSocket();
      joinRoom(meta.roomId, (joinResponse: any) => {
        console.log('AI 회의록 카드 전송 전 joinRoom 응답:', joinResponse);
        sendMessage(
          {
            roomId: meta.roomId,
            type: 'ai_summary',
            content: {
              type: 'doc',
              content: [
                {
                  type: 'documentCard',
                  attrs: {
                    documentId: doc.documentId,
                    title: meta.title,
                    roomId: meta.roomId,
                    docType: 'ai_summary',
                  },
                },
              ],
            },
          },
          (response: any) => {
            console.log('AI 회의록 카드 메시지 전송 응답:', response);
          },
        );
      });
    } catch (err) {
      console.error('문서 카드 메시지 전송 실패:', err);
    }
  };

  // 컴포넌트 마운트 시 문서 목록 조회
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setIsLoading(true);
        const urlRoom = new URLSearchParams(window.location.search).get('room');
        // URL에 room 파라미터가 있으면 해당 방의 문서만, 없으면 전체 조회
        const res = await getDocuments(urlRoom || undefined);
        setFiles(res.documents);
        localStorage.setItem('gooum_cached_documents', JSON.stringify(res.documents));

        // 선택된 파일이 없다면: 채팅 카드로 지정된 문서 → 없으면 첫 번째 파일 선택
        setActiveFileId((prev) => {
          if (prev) return prev;
          if (documentIdParam && res.documents.some((d) => d.documentId === documentIdParam)) {
            return documentIdParam;
          }
          if (res.documents.length > 0) return res.documents[0].documentId;
          return prev;
        });
      } catch (error) {
        console.error('문서 목록을 불러오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // 활성 파일 객체
  const activeFile = files.find((f) => f.documentId === activeFileId) || null;
  const filteredFiles = files.filter((f) => f.title.toLowerCase().includes(searchQuery.toLowerCase()));

  /* ── 문서 로딩 상태 ── */
  const [initialContent, setInitialContent] = useState<any>(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const editorRef = useRef<DocsEditorRef>(null);

  // 탭이 바뀔 때 문서 조회
  useEffect(() => {
    if (!activeFileId) return;

    // 방금 AI 회의록으로 생성한 문서라면, 이미 갖고 있는 (박스로 감싼) 콘텐츠를
    // 그대로 사용하고 서버 재조회는 건너뛴다.
    const pendingContent = pendingContentRef.current[activeFileId];
    if (pendingContent) {
      delete pendingContentRef.current[activeFileId];
      setInitialContent(pendingContent);
      setIsContentLoading(false);
      return;
    }

    let isMounted = true;
    const fetchContent = async () => {
      try {
        setIsContentLoading(true);
        console.log('📡 [API] 문서 상세 조회 (getDocumentById) 호출 시작:', activeFileId);
        const res = await getDocumentById(activeFileId);
        console.log('📡 [API] 문서 상세 조회 완료:', res);
        if (isMounted) {
          setInitialContent(res.content || '');
        }
      } catch (error) {
        console.error('문서 로딩 실패:', error);
      } finally {
        if (isMounted) setIsContentLoading(false);
      }
    };

    fetchContent();
    return () => {
      isMounted = false;
    };
  }, [activeFileId]);

  const handleTabSwitch = async (newId: string) => {
    if (activeFileId === newId) return;

    // 이동 전 기존 문서 자동 저장 강제 실행
    if (editorRef.current) {
      await editorRef.current.forceSave();
    }

    setActiveFileId(newId);
  };

  /* ── 공유 상태 관리 (헤더 표시용) ── */
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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

  const handleHeaderSave = () => {
    if (editorRef.current) {
      editorRef.current.handleSave();
    }
    setShowExportMenu(false);
  };

  const handleExportTXT = () => {
    setShowExportMenu(false);
    if (!editorRef.current || !activeFile) return;
    const text = editorRef.current.getText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFile.title || '새 문서'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    if (!activeFile) return;

    try {
      // 동적 임포트
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.querySelector('.ProseMirror');
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `${activeFile.title || '새 문서'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      html2pdf()
        .set(opt)
        .from(element as HTMLElement)
        .save();
    } catch (error) {
      console.error('PDF 변환 실패:', error);
      alert('PDF 변환 중 오류가 발생했습니다.');
    }
  };

  /* ── 파일 추가 (낙관적 업데이트 및 강제 저장) ── */
  const handleAddFile = async () => {
    if (editorRef.current) {
      await editorRef.current.forceSave();
    }

    const tempId = `temp-${crypto.randomUUID()}`;
    const tempDoc: Document = {
      documentId: tempId,
      title: '새 문서',
      type: 'document',
      createdBy: {
        userId: myProfile.id || 'current-user-id', // 실제 사용자 ID 연동
        name: currentUser.name || myProfile.name || '사용자',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFiles((prev) => [tempDoc, ...prev]);

    try {
      const newDoc = await createDocument({
        title: '새 문서',
        type: 'document',
      });

      setFiles((prev) => prev.map((f) => (f.documentId === tempId ? newDoc : f)));
      setActiveFileId(newDoc.documentId);
    } catch (error) {
      console.error('문서 생성 실패:', error);
      setFiles((prev) => prev.filter((f) => f.documentId !== tempId));
      alert('문서 생성에 실패했습니다.');
    }
  };

  /* ── 제목 수정 ── */
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (id: string) => {
    setEditingTitleId(id);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setFiles((prev) => prev.map((f) => (f.documentId === id ? { ...f, title: newTitle } : f)));
  };

  const finishEditing = async (documentId: string) => {
    setEditingTitleId(null);
    const doc = files.find((f) => f.documentId === documentId);
    if (doc) {
      try {
        // 제목 수정 시에도 저장 API 호출
        await saveDocument(documentId, { title: doc.title });
      } catch (error) {
        console.error('제목 저장 실패:', error);
      }
    }
  };

  /* ── 파일 삭제 (낙관적 업데이트) ── */
  const handleDeleteFile = async (id: string) => {
    if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return;

    const previousFiles = [...files];
    const next = files.filter((f) => f.documentId !== id);

    setFiles(next);
    if (activeFileId === id) {
      setActiveFileId(next.length > 0 ? next[0].documentId : null);
    }

    try {
      await deleteDocument(id);
    } catch (error: any) {
      console.error('문서 삭제 실패:', error);
      setFiles(previousFiles);
      if (activeFileId === id) setActiveFileId(id);

      if (error.response?.status === 403) {
        alert('문서 생성자만 삭제할 수 있습니다.');
      } else {
        alert('문서 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    /* ── 최외곽: Docs.png 연회색 배경 ── */
    <div className="relative flex h-full w-full flex-col bg-bg-canvas p-3 pb-4 font-sans">
      {/* ── 메인 카드 ── */}
      <div className="relative flex flex-1 overflow-hidden rounded-2xl bg-bg-default shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
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
                    <div className="h-4 w-4 shrink-0 rounded bg-gray-300 animate-pulse" />
                    <div className="h-3.5 w-2/3 rounded bg-gray-300 animate-pulse" />
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
                    isActive ? 'bg-bg-default shadow-sm' : 'hover:bg-bg-subtle'
                  }`}
                  onClick={() => {
                    if (!isEditing) {
                      handleTabSwitch(file.documentId);
                      setIsSidebarOpen(false); // 모바일에서 선택 시 닫기
                    }
                  }}>
                  {/* 왼쪽 파란 바 (활성 시) */}
                  <div
                    className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm transition-colors ${
                      isActive ? 'bg-blue-500' : 'bg-transparent'
                    }`}
                  />
                  {/* 제목 */}
                  {isEditing ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={file.title}
                      onChange={(e) => handleTitleChange(file.documentId, e.target.value)}
                      onBlur={() => finishEditing(file.documentId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditing(file.documentId);
                      }}
                      className="flex-1 rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[13px] outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={`flex-1 truncate ${isActive ? 'font-medium text-fg-primary' : 'text-fg-secondary'}`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditing(file.documentId);
                      }}
                      title="더블클릭하여 제목 수정">
                      {file.title || '새 문서'}
                    </span>
                  )}

                  {/* 우측: 사용자 아바타 (활성) or 삭제 */}
                  {isActive && !isEditing && (
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white overflow-hidden"
                      style={{
                        backgroundColor: currentUser.color,
                      }}>
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // 이미지 로드 실패 시 이니셜로 대체
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        currentUser.name.charAt(0)
                      )}
                    </span>
                  )}
                  {!isEditing && !isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.documentId);
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
        </aside>

        {/* ━━━ 우측 메인 에디터 ━━━ */}
        <main className="flex flex-1 flex-col overflow-hidden bg-bg-default">
          {activeFile ? (
            <>
              {/* 상단 헤더바 */}
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
                      ref={titleInputRef}
                      type="text"
                      value={activeFile.title}
                      onChange={(e) => handleTitleChange(activeFile.documentId, e.target.value)}
                      onBlur={() => finishEditing(activeFile.documentId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditing(activeFile.documentId);
                      }}
                      className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-sm font-medium outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEditing(`header-${activeFile.documentId}`)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-fg-secondary transition-colors hover:bg-bg-subtle">
                      {activeFile.title || '새 문서'}
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
                        className="relative flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white ring-2 ring-[var(--color-bg-default)] overflow-hidden transition-transform hover:z-10 hover:scale-110 flex-shrink-0"
                        style={{ backgroundColor: u.color }}
                        title={u.name}>
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // 이미지 로드 실패 시 이니셜로 대체 렌더링
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          u.name.charAt(0)
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="relative flex items-center export-menu-container">
                    <div className="flex rounded-lg shadow-[0_2px_8px_rgba(79,142,247,0.3)] transition-all hover:shadow-[0_4px_12px_rgba(79,142,247,0.4)]">
                      <button
                        onClick={handleHeaderSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-l-lg bg-gradient-to-r from-[#4f8ef7] to-[#5984f9] px-4 py-2 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-60 border-r border-blue-400/30">
                        {isSaving && (
                          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity="0.3" />
                            <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        )}
                        저장
                      </button>
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isSaving}
                        className="flex items-center justify-center rounded-r-lg bg-gradient-to-r from-[#5984f9] to-[#6c7bfa] px-2 py-2 text-white active:scale-95 disabled:opacity-60 hover:brightness-110"
                        title="내보내기 옵션">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>

                    {/* 내보내기 드롭다운 메뉴 */}
                    {showExportMenu && (
                      <div className="absolute right-0 top-[110%] w-40 rounded-xl border border-border-default bg-bg-default p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-50">
                        <button
                          onClick={handleExportPDF}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-fg-primary transition-colors hover:bg-bg-subtle hover:text-blue-600">
                          <span className="text-sm">📄</span>
                          PDF로 저장
                        </button>
                        <button
                          onClick={handleExportTXT}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-fg-primary transition-colors hover:bg-bg-subtle hover:text-blue-600">
                          <span className="text-sm">📝</span>
                          TXT로 저장
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>

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
                    <div className="py-10 text-gray-400">문서 로딩 중...</div>
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
    </div>
  );
};
