import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { saveDocument } from '@/api/documents';
import type { Document } from '@/types/document';
import { AiMinutesBlock } from '@/components/AiMinutesBlock';

interface DocsEditorProps {
  activeFile: Document;
  initialContent: any;
  currentUser: { name: string; color: string; avatar?: string };
  setFiles: React.Dispatch<React.SetStateAction<Document[]>>;
  onActiveUsersChange: (users: any[]) => void;
  onIsSavingChange: (isSaving: boolean) => void;
  setToastMessage: (msg: string | null) => void;
}

export interface DocsEditorRef {
  forceSave: () => Promise<void>;
  focus: () => void;
  handleSave: () => Promise<void>;
  getText: () => string;
  getHTML: () => string;
}

export const DocsEditor = forwardRef<DocsEditorRef, DocsEditorProps>(
  (
    { activeFile, initialContent, currentUser, setFiles, onActiveUsersChange, onIsSavingChange, setToastMessage },
    ref,
  ) => {
    const wsUrl = import.meta.env.PROD ? 'wss://app-gooum-backend.azurewebsites.net/' : 'ws://localhost:8000';

    const [docState, setDocState] = useState<{
      ydoc: Y.Doc;
      provider: WebsocketProvider;
    } | null>(null);

    // 실시간 마우스 포인터 상태
    const [pointers, setPointers] = useState<Record<string, any>>({});

    // 1. Yjs 초기화
    useEffect(() => {
      const doc = new Y.Doc();
      const prov = new WebsocketProvider(wsUrl, `doc-${activeFile.documentId}`, doc);

      setDocState({ ydoc: doc, provider: prov });

      return () => {
        prov.destroy();
        doc.destroy();
      };
    }, [activeFile.documentId, wsUrl, currentUser]);

    // 2. 접속자 및 마우스 포인터 관리
    useEffect(() => {
      if (!docState?.provider) return;
      const updateUsers = () => {
        const states = Array.from(docState.provider.awareness.getStates().entries());
        const users = states.map(([_, state]: any) => state.user).filter((u) => u && u.name);
        const uniqueUsers = users.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
        onActiveUsersChange(uniqueUsers);

        const newPointers: Record<string, any> = {};
        states.forEach(([clientId, state]: any) => {
          if (clientId !== docState.ydoc.clientID && state.pointer && state.user) {
            newPointers[clientId] = {
              pointer: state.pointer,
              user: state.user,
            };
          }
        });
        setPointers(newPointers);
      };
      docState.provider.awareness.on('update', updateUsers);
      updateUsers();
      return () => {
        docState.provider.awareness.off('update', updateUsers);
      };
    }, [docState?.provider, onActiveUsersChange]);

    // 3. 에디터 초기화
    const editor = useEditor(
      {
        extensions: [
          StarterKit.configure({ undoRedo: false }),
          AiMinutesBlock,
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
        // 핵심: 최초 마운트 시 initialContent를 Tiptap이 자동으로 Y.Doc에 덮어씌움!
        content: initialContent || '',
        editorProps: {
          attributes: {
            class: 'docs-editor-body',
          },
        },
      },
      [docState],
    );

    // 핵심: Tiptap Collaboration 확장은 초기 마운트 시의 content 속성을 무시합니다!
    // 따라서 Yjs 웹소켓 동기화가 완료된 시점에, 방이 비어있다면 강제로 주입해야 합니다.
    useEffect(() => {
      if (!editor || !docState?.provider || !initialContent) return;

      const handleSync = (isSynced: boolean) => {
        if (isSynced && editor.isEmpty) {
          // 서버에서 가져온 내용을 에디터에 주입하고 WebSocket으로 브로드캐스트
          editor.commands.setContent(initialContent);
        }
      };

      // @ts-ignore
      docState.provider.on('sync', handleSync);

      // 만약 이미 동기화가 끝났다면 즉시 실행
      // @ts-ignore
      if (docState.provider.synced) {
        handleSync(true);
      }

      return () => {
        // @ts-ignore
        docState.provider.off('sync', handleSync);
      };
    }, [editor, docState?.provider, initialContent]);

    // 4. 저장 로직
    const lastSavedContent = useRef<string>(JSON.stringify(initialContent || {}));

    // 에디터 객체가 준비되면 캐시 최신화
    useEffect(() => {
      if (editor) {
        lastSavedContent.current = JSON.stringify(editor.getJSON());
      }
    }, [editor]);

    const handleSave = async () => {
      if (!editor || !activeFile) return;

      onIsSavingChange(true);
      setToastMessage('문서가 성공적으로 저장되었습니다!');

      setFiles((prev) =>
        prev.map((f) => (f.documentId === activeFile.documentId ? { ...f, updatedAt: new Date().toISOString() } : f)),
      );

      const currentContentJSON = editor.getJSON();
      lastSavedContent.current = JSON.stringify(currentContentJSON);

      console.log('📡 [API] 문서 수동 저장 (saveDocument) 호출 시작:', activeFile.documentId);
      try {
        await saveDocument(activeFile.documentId, {
          title: activeFile.title,
          content: currentContentJSON,
        });
        console.log('📡 [API] 문서 수동 저장 완료');
      } catch (error) {
        console.error('문서 저장 실패:', error);
        setToastMessage('저장 실패! 서버 오류가 발생했습니다.');
      } finally {
        onIsSavingChange(false);
        setTimeout(() => setToastMessage(null), 3000);
      }
    };

    // 3초 자동 저장
    useEffect(() => {
      if (!editor || !activeFile) return;

      const interval = setInterval(async () => {
        const currentContentJSON = editor.getJSON();
        const currentContentStr = JSON.stringify(currentContentJSON);

        if (currentContentStr !== lastSavedContent.current) {
          console.log('📡 [API] 문서 자동 저장 (saveDocument) 호출 시작:', activeFile.documentId);
          try {
            await saveDocument(activeFile.documentId, {
              title: activeFile.title,
              content: currentContentJSON,
            });
            console.log('📡 [API] 문서 자동 저장 완료');
            lastSavedContent.current = currentContentStr;

            setToastMessage('자동 저장됨');
            setTimeout(() => setToastMessage(null), 2000);
          } catch (error) {
            console.error('자동 저장 실패:', error);
          }
        }
      }, 3000);

      return () => clearInterval(interval);
    }, [editor, activeFile.documentId, activeFile.title, setToastMessage]);

    useImperativeHandle(ref, () => ({
      forceSave: async () => {
        if (!editor || !activeFile) return;
        const currentContentJSON = editor.getJSON();
        const currentContentStr = JSON.stringify(currentContentJSON);

        if (currentContentStr !== lastSavedContent.current) {
          try {
            await saveDocument(activeFile.documentId, {
              title: activeFile.title,
              content: currentContentJSON,
            });
            lastSavedContent.current = currentContentStr;
          } catch (err) {
            console.error('강제 저장 실패:', err);
          }
        }
      },
      handleSave,
      focus: () => editor?.commands.focus(),
      getText: () => editor?.getText() || '',
      getHTML: () => editor?.getHTML() || '',
    }));

    if (!editor || !docState) {
      return <div className="text-gray-400">에디터 로딩 중...</div>;
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!docState?.provider) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      docState.provider.awareness.setLocalStateField('pointer', { x, y });
    };
    
    const handleMouseLeave = () => {
      if (!docState?.provider) return;
      docState.provider.awareness.setLocalStateField('pointer', null);
    };

    return (
      <div 
        className="relative min-h-[500px]" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
      >
        <EditorContent editor={editor} />
        
        {/* 상대방 마우스 커서 렌더링 */}
        {Object.entries(pointers).map(([clientId, data]) => (
          <div
            key={clientId}
            className="pointer-events-none absolute z-50 flex items-center gap-1.5 transition-all duration-75 ease-linear"
            style={{
              left: data.pointer.x,
              top: data.pointer.y,
              transform: 'translate(-2px, -2px)'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={data.user.color}
              stroke="white"
              strokeWidth="2"
              className="drop-shadow-md"
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
            <span 
              className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow-sm whitespace-nowrap"
              style={{ backgroundColor: data.user.color }}
            >
              {data.user.name}
            </span>
          </div>
        ))}
      </div>
    );
  },
);
