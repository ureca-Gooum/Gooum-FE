import { useState, useRef, useEffect, useMemo } from 'react';
import { showAlert } from '@/utils/alert';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import type { DocsEditorRef } from '@/components/DocsEditor';
import { wrapAiMinutesContent } from '@/utils/tiptap';

import { getDocuments, getDocumentById, createDocument, saveDocument, deleteDocument } from '@/api/documents';
import type { Document as DocumentModel } from '@/types/document';
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

const getUserColor = (idOrName: string) => {
  let hash = 0;
  for (let i = 0; i < idOrName.length; i++) {
    hash = idOrName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const useDocsPage = () => {
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
      color: getUserColor(myProfile.name),
      avatar: myProfile.avatar,
    };
  }, [myProfile]);

  /* ── URL 쿼리 파라미터 ── */
  const [searchParams] = useSearchParams();
  const roomIdParam = searchParams.get('room');
  const documentIdParam = searchParams.get('document');

  /* ── 채팅 페이지에서 카톡 캡쳐 방식으로 선택해온 메시지들 (navigate state) ── */
  const location = useLocation();
  const navigate = useNavigate();
  const navState = (location.state as { roomId?: string; messages?: Message[] } | null) || null;
  const aiSummaryRoomId = navState?.roomId || roomIdParam || '';
  const aiSummaryMessages = navState?.messages || [];

  /* ── 파일 목록 상태 ── */
  const [files, setFiles] = useState<DocumentModel[]>(() => {
    const cached = localStorage.getItem('gooum_cached_documents');
    return cached ? JSON.parse(cached) : [];
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('gooum_cached_documents'));

  /* ── AI 회의록 생성 모달 상태 ── */
  const [isAiMinutesOpen, setIsAiMinutesOpen] = useState(false);
  const pendingContentRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (navState?.messages && navState.messages.length > 0) {
      setIsAiMinutesOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (documentIdParam && files.some((f) => f.documentId === documentIdParam)) {
      setActiveFileId(documentIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentIdParam, files]);

  const handleMinutesCreated = (doc: DocumentModel, meta: { roomId: string; title: string; transcript: string }) => {
    const wrappedContent = wrapAiMinutesContent(doc.content, meta);
    pendingContentRef.current[doc.documentId] = wrappedContent;

    setFiles((prev) => [{ ...doc, content: wrappedContent }, ...prev]);
    setActiveFileId(doc.documentId);
    setIsAiMinutesOpen(false);

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

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setIsLoading(true);
        const urlRoom = new URLSearchParams(window.location.search).get('room');
        const res = await getDocuments(urlRoom || undefined);
        setFiles(res.documents);
        localStorage.setItem('gooum_cached_documents', JSON.stringify(res.documents));

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

  useEffect(() => {
    if (!activeFileId) return;

    const fetchActiveFileDetail = async () => {
      try {
        const detailDoc = await getDocumentById(activeFileId);
        setFiles((prevFiles) => prevFiles.map((doc) => (doc.documentId === activeFileId ? detailDoc : doc)));
      } catch (error) {
        console.error('문서 상세 정보를 불러오는 데 실패했습니다:', error);
      }
    };

    fetchActiveFileDetail();
  }, [activeFileId]);

  const activeFile = files.find((f) => f.documentId === activeFileId) || null;
  const filteredFiles = files.filter((f) => f.title.toLowerCase().includes(searchQuery.toLowerCase()));

  /* ── 문서 로딩 상태 ── */
  const [initialContent, setInitialContent] = useState<any>(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const editorRef = useRef<DocsEditorRef>(null);

  useEffect(() => {
    if (!activeFileId) return;

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

    if (editorRef.current) {
      await editorRef.current.forceSave();
    }

    setActiveFileId(newId);
  };

  /* ── 공유 상태 관리 ── */
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeUserNames = useMemo(() => {
    return new Set(activeUsers.map((u) => u.name?.trim()).filter(Boolean));
  }, [activeUsers]);

  const offlineMembers = useMemo(() => {
    if (!activeFile) return [];

    let rawCollaborators: Array<{ userId?: string; name: string; avatar?: string | null }> = [];

    if (Array.isArray(activeFile.collaborators) && activeFile.collaborators.length > 0) {
      rawCollaborators = activeFile.collaborators;
    } else if (activeFile.createdBy) {
      if (typeof activeFile.createdBy === 'object' && 'name' in activeFile.createdBy) {
        rawCollaborators = [activeFile.createdBy as { userId?: string; name: string; avatar?: string | null }];
      }
    }

    if (rawCollaborators.length === 0) return [];

    return rawCollaborators
      .filter((collab) => {
        const name = collab?.name?.trim();
        return name && !activeUserNames.has(name);
      })
      .map((collab) => ({
        name: collab.name,
        color: getUserColor(collab.name),
        avatar: collab.avatar || '',
        isOnline: false,
      }));
  }, [activeFile, activeUserNames]);

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

  const handleExportPDF = () => {
    setShowExportMenu(false);
    if (!activeFile) return;

    setTimeout(async () => {
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.querySelector('.ProseMirror');
        if (!element) return;

        // 1. 현재 문서의 모든 스타일(CSS) 수집
        let safeCss = '';
        const styleTags = document.querySelectorAll('style');
        styleTags.forEach((tag) => {
          safeCss += tag.innerHTML + '\n';
        });

        const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
        for (const link of Array.from(linkTags)) {
          try {
            const res = await fetch((link as HTMLLinkElement).href);
            const text = await res.text();
            safeCss += text + '\n';
          } catch {
            console.warn('CSS fetch failed for', (link as HTMLLinkElement).href);
          }
        }

        // 2. html2canvas를 터뜨리는 범인(oklch 등) 원천 차단
        safeCss = safeCss
          .replace(/oklch/g, 'invalidcolor')
          .replace(/oklab/g, 'invalidcolor')
          .replace(/color\(/g, 'invalidcolor(')
          .replace(/lch\(/g, 'invalidcolor(')
          .replace(/lab\(/g, 'invalidcolor(');

        // PDF 렌더링 시 oklch가 무효화되면서 잃어버린 주요 색상을 안전한 RGB로 수동 복구
        const fallbackStyles = `
          .bg-slate-100 { background-color: rgb(241, 245, 249) !important; }
          .border-slate-200 { border-color: rgb(226, 232, 240) !important; }
          .text-blue-600 { color: rgb(37, 99, 235) !important; }
          .text-slate-700 { color: rgb(51, 65, 85) !important; }
          .text-slate-500 { color: rgb(100, 116, 139) !important; }
          .text-slate-400 { color: rgb(148, 163, 184) !important; }
          .text-red-500 { color: rgb(239, 68, 68) !important; }
          .bg-white { background-color: rgb(255, 255, 255) !important; }
        `;
        safeCss += '\n' + fallbackStyles;

        const opt = {
          margin: 10,
          filename: `${activeFile.title || '새 문서'}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            // 메인 문서의 원본 스타일(oklch 포함)을 html2canvas가 복제하지 못하도록 차단
            ignoreElements: (node: Element) => {
              if (node.tagName === 'STYLE' || node.tagName === 'LINK') return true;
              return false;
            },
            // 복제된 문서에 oklch가 제거된 안전한 CSS(safeCss)만 주입
            onclone: (clonedDoc: Document) => {
              const style = clonedDoc.createElement('style');
              style.innerHTML = safeCss;
              clonedDoc.head.appendChild(style);

              // 인라인 스타일 처리
              const elements = clonedDoc.querySelectorAll('*');
              elements.forEach((el) => {
                const styleAttr = el.getAttribute('style');
                if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('color('))) {
                  el.setAttribute(
                    'style',
                    styleAttr.replace(/oklch/g, 'invalidcolor').replace(/color\(/g, 'invalidcolor('),
                  );
                }
              });
            },
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        };

        await html2pdf()
          .set(opt)
          .from(element as HTMLElement)
          .save();
      } catch (error) {
        console.error('PDF 변환 실패:', error);
      }
    }, 100);
  };

  /* ── 파일 추가 (낙관적 업데이트 및 강제 저장) ── */
  const handleAddFile = async () => {
    if (editorRef.current) {
      await editorRef.current.forceSave();
    }

    const tempId = `temp-${crypto.randomUUID()}`;
    const tempDoc: DocumentModel = {
      documentId: tempId,
      title: '새 문서',
      type: 'document',
      createdBy: {
        userId: myProfile.id || 'current-user-id',
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
      showAlert('문서 생성에 실패했습니다.');
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
        await saveDocument(documentId, { title: doc.title });
      } catch (error) {
        console.error('제목 저장 실패:', error);
      }
    }
  };

  /* ── 파일 삭제 ── */
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [docToDeleteId, setDocToDeleteId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleDeleteFileClick = (id: string) => {
    setDocToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!docToDeleteId) return;
    const id = docToDeleteId;

    const previousFiles = [...files];
    const next = files.filter((f) => f.documentId !== id);

    setFiles(next);
    if (activeFileId === id) {
      setActiveFileId(next.length > 0 ? next[0].documentId : null);
    }

    setIsDeleteConfirmOpen(false);

    try {
      await deleteDocument(id);
    } catch (error: any) {
      console.error('문서 삭제 실패:', error);
      setFiles(previousFiles);
      if (activeFileId === id) setActiveFileId(id);

      if (error.response?.status === 403) {
        setAlertMessage('문서 생성자만 삭제할 수 있습니다.');
      } else {
        setAlertMessage('문서 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return {
    // states
    isSidebarOpen,
    setIsSidebarOpen,
    myProfile,
    currentUser,
    aiSummaryRoomId,
    aiSummaryMessages,
    files,
    setFiles,
    activeFileId,
    searchQuery,
    setSearchQuery,
    isLoading,
    isAiMinutesOpen,
    setIsAiMinutesOpen,
    activeFile,
    filteredFiles,
    initialContent,
    isContentLoading,
    editorRef,
    activeUsers,
    setActiveUsers,
    isSaving,
    setIsSaving,
    toastMessage,
    setToastMessage,
    showExportMenu,
    setShowExportMenu,
    offlineMembers,
    editingTitleId,
    setEditingTitleId,
    titleInputRef,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    alertMessage,
    setAlertMessage,
    // handlers
    handleMinutesCreated,
    handleTabSwitch,
    handleExportTXT,
    handleExportPDF,
    handleAddFile,
    startEditing,
    handleTitleChange,
    finishEditing,
    handleDeleteFileClick,
    confirmDeleteFile,
    navigate, // Need to export navigate since we use it in DocsPage.tsx
  };
};
