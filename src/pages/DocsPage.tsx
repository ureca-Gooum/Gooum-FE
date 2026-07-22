// src/pages/DocsPage.tsx
import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import {
    getDocuments,
    createDocument,
    saveDocument,
    deleteDocument,
} from "@/api/documents";
import type { Document } from "@/types/document";

const userColors = ["#958DF1", "#F98181", "#FBCE76", "#8AE234", "#3498DB"];
const userNames = ["ㅇㅇ1", "ㅇㅇ2", "ㅇㅇ3", "ㅇㅇ4", "ㅇㅇ5"];

const getRandomItem = (array: string[]) =>
    array[Math.floor(Math.random() * array.length)];
const currentUser = {
    name: getRandomItem(userNames),
    color: getRandomItem(userColors),
};

// 사용자가 제공한 기본 Room ID (채팅방 ID)
const DEFAULT_ROOM_ID = "6a5daef3985ae04d3626cca3";

export const DocsPage = () => {
    /* ── 파일 목록 상태 ── */
    const [files, setFiles] = useState<Document[]>(() => {
        const cached = localStorage.getItem("gooum_cached_documents");
        return cached ? JSON.parse(cached) : [];
    });
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(() => !localStorage.getItem("gooum_cached_documents"));

    // 컴포넌트 마운트 시 문서 목록 조회
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                setIsLoading(true);
                const urlRoom = new URLSearchParams(window.location.search).get("room");
                // URL에 room 파라미터가 있으면 해당 방의 문서만, 없으면 전체 조회
                const res = await getDocuments(urlRoom || undefined);
                setFiles(res.documents);
                localStorage.setItem("gooum_cached_documents", JSON.stringify(res.documents));
                
                // 선택된 파일이 없다면 첫 번째 파일 선택
                setActiveFileId((prev) => {
                    if (!prev && res.documents.length > 0) return res.documents[0].documentId;
                    return prev;
                });
            } catch (error) {
                console.error("문서 목록을 불러오는 중 오류 발생:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocs();
    }, []);

    // 활성 파일 객체
    const activeFile = files.find((f) => f.documentId === activeFileId) || null;
    const filteredFiles = files.filter((f) =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    /* ── Yjs + WebSocket Provider ── */
    const [docState, setDocState] = useState<{
        ydoc: Y.Doc;
        provider: WebsocketProvider;
    } | null>(null);

    const wsUrl = import.meta.env.PROD
        ? "wss://app-gooum-backend.azurewebsites.net/"
        : "ws://localhost:8000";

    useEffect(() => {
        if (!activeFileId) {
            setDocState(null);
            return;
        }

        const doc = new Y.Doc();
        // 문서별 고유한 Yjs 방 이름 사용 (documentId 활용)
        const prov = new WebsocketProvider(wsUrl, `doc-${activeFileId}`, doc);

        setDocState({ ydoc: doc, provider: prov });

        return () => {
            prov.destroy();
            doc.destroy();
        };
    }, [activeFileId]);

    /* ── 활성 접속자 상태 ── */
    const [activeUsers, setActiveUsers] = useState<any[]>([]);

    useEffect(() => {
        if (!docState?.provider) return;

        const updateUsers = () => {
            const states = Array.from(
                docState.provider.awareness.getStates().values(),
            );
            const users = states
                .map((state: any) => state.user)
                .filter((u) => u && u.name);

            // 이름 기준으로 중복 제거
            const uniqueUsers = users.filter(
                (v, i, a) => a.findIndex((t) => t.name === v.name) === i,
            );
            setActiveUsers(uniqueUsers);
        };

        docState.provider.awareness.on("update", updateUsers);
        updateUsers();

        return () => {
            docState.provider.awareness.off("update", updateUsers);
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
                    placeholder: "입력하기 시작하세요...",
                }),
            ],
            // Yjs가 초기화되기 전에 에디터를 비워둡니다.
            content: "",
            editorProps: {
                attributes: {
                    class: "docs-editor-body",
                },
            },
        },
        [docState],
    );

    /* ── 저장 ── */
    const [isSaving, setIsSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleSave = async () => {
        if (!editor || !activeFile) return;
        setIsSaving(true);
        setToastMessage("저장 중...");
        try {
            const contentJSON = editor.getJSON();
            // 백엔드 API 연동: PATCH /api/documents/{documentId}
            await saveDocument(activeFile.documentId, {
                title: activeFile.title,
                content: contentJSON,
            });
            setToastMessage("문서가 성공적으로 저장되었습니다!");
            
            // 저장 성공 시 목록 갱신 (선택 사항)
            setFiles((prev) =>
                prev.map((f) =>
                    f.documentId === activeFile.documentId
                        ? { ...f, updatedAt: new Date().toISOString() }
                        : f
                )
            );
        } catch (error) {
            console.error("문서 저장 실패:", error);
            setToastMessage("저장 실패! 서버 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    /* ── 파일 추가 ── */
    const handleAddFile = async () => {
        try {
            // 백엔드 API 연동: POST /api/documents
            const newDoc = await createDocument({
                title: "새 문서",
                roomId: DEFAULT_ROOM_ID, // 임시 기본 방 ID
            });
            
            setFiles((prev) => [newDoc, ...prev]);
            setActiveFileId(newDoc.documentId);
        } catch (error) {
            console.error("문서 생성 실패:", error);
            alert("문서 생성에 실패했습니다.");
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
        setFiles((prev) =>
            prev.map((f) => (f.documentId === id ? { ...f, title: newTitle } : f)),
        );
    };

    const finishEditing = async (documentId: string) => {
        setEditingTitleId(null);
        const doc = files.find((f) => f.documentId === documentId);
        if (doc) {
            try {
                // 제목 수정 시에도 저장 API 호출
                await saveDocument(documentId, { title: doc.title });
            } catch (error) {
                console.error("제목 저장 실패:", error);
            }
        }
    };

    /* ── 파일 삭제 ── */
    const handleDeleteFile = async (id: string) => {
        if (!confirm("정말로 이 문서를 삭제하시겠습니까?")) return;
        
        try {
            // 백엔드 API 연동: DELETE /api/documents/{documentId}
            await deleteDocument(id);
            const next = files.filter((f) => f.documentId !== id);
            setFiles(next);
            
            if (activeFileId === id) {
                setActiveFileId(next.length > 0 ? next[0].documentId : null);
            }
        } catch (error: any) {
            console.error("문서 삭제 실패:", error);
            if (error.response?.status === 403) {
                alert("문서 생성자만 삭제할 수 있습니다.");
            } else {
                alert("문서 삭제 중 오류가 발생했습니다.");
            }
        }
    };



    return (
        /* ── 최외곽: Docs.png 연회색 배경 ── */
        <div className="relative flex h-full w-full flex-col bg-[#eef1f6] p-3 pb-4 font-sans">
            {/* "Docs" 라벨 */}
            <span className="mb-2 pl-1 text-[13px] font-semibold text-blue-500">
                Docs
            </span>

            {/* ── 메인 카드 ── */}
            <div className="flex flex-1 overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                {/* ━━━ 좌측 사이드바 ━━━ */}
                <aside className="flex w-[260px] min-w-[260px] flex-col border-r border-gray-200 bg-gradient-to-b from-[#eef4ff] to-[#f5f8ff]">
                    {/* Gooum 타이틀 */}
                    <div className="px-5 pt-5 pb-3">
                        <span className="text-base font-bold text-slate-800">
                            Gooum
                        </span>
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
                                strokeWidth={2}
                            >
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
                            title="필터"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <line x1="4" y1="6" x2="20" y2="6" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                                <line x1="11" y1="18" x2="13" y2="18" />
                            </svg>
                        </button>
                        {/* + 버튼 */}
                        <button
                            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-black/5 hover:text-blue-500"
                            title="새 문서 추가"
                            onClick={handleAddFile}
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
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
                            <p className="py-6 text-center text-xs text-gray-400">
                                문서가 없습니다
                            </p>
                        )}
                        {filteredFiles.map((file) => {
                            const isActive = file.documentId === activeFileId;
                            const isEditing = editingTitleId === file.documentId;

                            return (
                                <div
                                    key={file.documentId}
                                    className={`group relative mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2.5 text-[13px] transition-colors select-none ${
                                        isActive
                                            ? "bg-white shadow-sm"
                                            : "hover:bg-white/50"
                                    }`}
                                    onClick={() => {
                                        if (!isEditing)
                                            setActiveFileId(file.documentId);
                                    }}
                                >
                                    {/* 왼쪽 파란 바 (활성 시) */}
                                    <div
                                        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm transition-colors ${
                                            isActive
                                                ? "bg-blue-500"
                                                : "bg-transparent"
                                        }`}
                                    />

                                    {/* 문서 아이콘 */}
                                    <span className="ml-1 shrink-0 text-sm">
                                        {isActive ? "🌐" : "📄"}
                                    </span>

                                    {/* 제목 */}
                                    {isEditing ? (
                                        <input
                                            ref={titleInputRef}
                                            type="text"
                                            value={file.title}
                                            onChange={(e) =>
                                                handleTitleChange(
                                                    file.documentId,
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() => finishEditing(file.documentId)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    finishEditing(file.documentId);
                                            }}
                                            className="flex-1 rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[13px] outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span
                                            className={`flex-1 truncate ${
                                                isActive
                                                    ? "font-medium text-slate-800"
                                                    : "text-slate-500"
                                            }`}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                startEditing(file.documentId);
                                            }}
                                            title="더블클릭하여 제목 수정"
                                        >
                                            {file.title || "새 문서"}
                                        </span>
                                    )}

                                    {/* 우측: 사용자 아바타 (활성) or 삭제 */}
                                    {isActive && !isEditing && (
                                        <span
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                            style={{
                                                backgroundColor:
                                                    currentUser.color,
                                            }}
                                        >
                                            {currentUser.name.charAt(0)}
                                        </span>
                                    )}
                                    {!isEditing && !isActive && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFile(file.documentId);
                                            }}
                                            className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:text-red-500 group-hover:flex"
                                            title="삭제"
                                        >
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
                            strokeWidth={1.5}
                        >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span className="text-[13px] text-gray-400">
                            휴지통
                        </span>
                    </div>
                </aside>

                {/* ━━━ 우측 메인 에디터 ━━━ */}
                <main className="flex flex-1 flex-col overflow-hidden bg-white">
                    {activeFile ? (
                        <>
                            {/* 상단 헤더바 */}
                            <header className="flex min-h-[48px] items-center justify-between border-b border-gray-100 px-5 py-2.5">
                                {/* 왼쪽: 문서 제목 */}
                                <div className="flex items-center">
                                    {editingTitleId === `header-${activeFile.documentId}` ? (
                                        <input
                                            ref={titleInputRef}
                                            type="text"
                                            value={activeFile.title}
                                            onChange={(e) =>
                                                handleTitleChange(
                                                    activeFile.documentId,
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() => finishEditing(activeFile.documentId)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") finishEditing(activeFile.documentId);
                                            }}
                                            className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-sm font-medium outline-none"
                                        />
                                    ) : (
                                        <button
                                            onClick={() =>
                                                startEditing(`header-${activeFile.documentId}`)
                                            }
                                            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                                        >
                                            {activeFile.title || "새 문서"}
                                            <svg
                                                className="h-3 w-3 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
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
                                                title={u.name}
                                            >
                                                {u.name.charAt(0)}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#4f8ef7] to-[#6c7bfa] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(79,142,247,0.3)] transition-all hover:shadow-[0_4px_12px_rgba(79,142,247,0.4)] active:scale-95 disabled:opacity-60"
                                    >
                                        {isSaving && (
                                            <svg
                                                className="h-3.5 w-3.5 animate-spin"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="white"
                                                    strokeWidth="3"
                                                    opacity="0.3"
                                                />
                                                <path
                                                    d="M4 12a8 8 0 018-8"
                                                    stroke="white"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        )}
                                        저장
                                        <svg
                                            className="h-3 w-3"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                </div>
                            </header>

                            {/* 에디터 본문 */}
                            <div
                                className="flex-1 cursor-text overflow-y-auto px-16 py-10"
                                onClick={() => editor?.commands.focus()}
                            >
                                <div className="mx-auto max-w-[720px]">
                                    {/* 큰 제목 */}
                                    {editingTitleId === `main-${activeFile.documentId}` ? (
                                        <input
                                            type="text"
                                            value={activeFile.title}
                                            onChange={(e) =>
                                                handleTitleChange(
                                                    activeFile.documentId,
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() => finishEditing(activeFile.documentId)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    finishEditing(activeFile.documentId);
                                            }}
                                            autoFocus
                                            className="mb-3 w-full border-none bg-transparent text-[32px] font-bold leading-tight text-slate-800 outline-none placeholder:text-gray-300"
                                            placeholder="새 문서"
                                        />
                                    ) : (
                                        <h1
                                            className="mb-3 cursor-text text-[32px] font-bold leading-tight text-slate-800 transition-colors hover:text-slate-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTitleId(
                                                    `main-${activeFile.documentId}`,
                                                );
                                            }}
                                        >
                                            {activeFile.title || "새 문서"}
                                        </h1>
                                    )}

                                    {/* Tiptap 에디터 */}
                                    {editor ? (
                                        <EditorContent editor={editor} />
                                    ) : (
                                        <div className="text-gray-400">에디터 로딩 중...</div>
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
                                    <svg
                                        className="h-4 w-4 animate-spin text-blue-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            opacity="0.3"
                                        />
                                        <path
                                            d="M4 12a8 8 0 018-8"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-4 w-4 text-emerald-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                                <span className="text-[13px] font-medium text-gray-600">
                                    {toastMessage}
                                </span>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
