import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Code2,
  Paperclip,
  FileText,
  Sparkles,
  Send,
  X,
} from 'lucide-react';
import { uploadFile } from '@/api/upload';
import type { TiptapDoc } from '@/types/chat';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  label: string;
  children: React.ReactNode;
}

const ToolbarButton = ({ onClick, isActive, label, children }: ToolbarButtonProps) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={label}
    className={`rounded-md p-1.5 text-fg-tertiary transition-colors hover:bg-bg-subtle ${
      isActive ? 'bg-bg-subtle text-fg-primary' : ''
    }`}>
    {children}
  </button>
);

const Toolbar = ({
  editor,
  onAttachClick,
  isAttachDisabled,
}: {
  editor: Editor | null;
  onAttachClick?: () => void;
  isAttachDisabled?: boolean;
}) => {
  if (!editor) return null;

  const handleToggleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('연결할 링크 주소를 입력하세요.', 'https://');
    if (!url) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex items-center gap-0.5 border-b border-border-default pb-1.5">
      <ToolbarButton
        label="굵게"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="기울임"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="밑줄"
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="취소선"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={16} />
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-border-default" />

      <ToolbarButton label="링크" isActive={editor.isActive('link')} onClick={handleToggleLink}>
        <LinkIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="번호 목록"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="글머리 목록"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-border-default" />

      <ToolbarButton
        label="코드 블록"
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 size={16} />
      </ToolbarButton>

      {onAttachClick && (
        <>
          <span className="mx-1 h-4 w-px bg-border-default" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onAttachClick}
            disabled={isAttachDisabled}
            title={isAttachDisabled ? '업로드 중...' : '파일 첨부'}
            className="rounded-md p-1.5 text-fg-tertiary transition-colors hover:bg-bg-subtle disabled:opacity-40">
            <Paperclip size={16} />
          </button>
        </>
      )}
    </div>
  );
};

interface ChatMessageInputProps {
  /** 전송 버튼 클릭 또는 Enter 입력 시 호출. Tiptap JSON 문서를 그대로 넘겨준다. */
  onSend: (content: TiptapDoc) => void;
  /** 파일 첨부(클립 아이콘)로 업로드가 끝난 후 호출. 넘기지 않으면 첨부 버튼이 렌더링되지 않는다. */
  onSendFile?: (payload: { type: 'image' | 'file'; fileUrl: string; fileName: string }) => void;
  /** 입력 중일 때마다 호출 (타이핑 인디케이터용) */
  onTyping?: () => void;
  /** AI 회의록 버튼. 넘기지 않으면 버튼이 렌더링되지 않는다. */
  onOpenAiMinutes?: () => void;
  /** 문서 아이콘 버튼. 이 채팅방 id로 된 동시문서편집 문서를 만들고 이동한다. 넘기지 않으면 버튼이 렌더링되지 않는다. */
  onCreateDocument?: () => void;
  placeholder?: string;
}

export const ChatMessageInput = ({
  onSend,
  onSendFile,
  onTyping,
  onOpenAiMinutes,
  onCreateDocument,
  placeholder = '메시지를 입력하세요.',
}: ChatMessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    type: 'image' | 'file';
    fileUrl: string;
    fileName: string;
    previewUrl?: string;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-content max-h-40 min-h-[24px] overflow-y-auto text-sm text-fg-primary outline-none',
      },
      // Enter는 전송, Shift+Enter는 기본 동작(줄바꿈)이 그대로 실행되도록 여기서만 가로챈다.
      // 단, 코드 블록이나 리스트 안에서는 Enter가 원래 하던 일(줄바꿈/새 목록 항목)을 해야 하므로 그대로 둔다.
      handleKeyDown: (_view, event) => {
        const inCodeBlock = editor?.isActive('codeBlock');
        const inList = editor?.isActive('listItem');

        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !inCodeBlock && !inList) {
          event.preventDefault();
          handleSend();
          return true;
        }
        return false;
      },
    },
    onUpdate: () => {
      onTyping?.();
    },
  });

  useEffect(() => {
    return () => editor?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const [, forceToolbarUpdate] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const rerender = () => forceToolbarUpdate((n) => n + 1);
    editor.on('transaction', rerender);
    editor.on('selectionUpdate', rerender);
    return () => {
      editor.off('transaction', rerender);
      editor.off('selectionUpdate', rerender);
    };
  }, [editor]);

  const handleSend = () => {
    if (isUploading) return;

    const hasText = !!editor && !editor.isEmpty;
    if (!hasText && !pendingAttachment) return;

    if (pendingAttachment) {
      onSendFile?.({
        type: pendingAttachment.type,
        fileUrl: pendingAttachment.fileUrl,
        fileName: pendingAttachment.fileName,
      });
      if (pendingAttachment.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
      setPendingAttachment(null);
    }

    if (hasText && editor) {
      const content = editor.getJSON() as TiptapDoc;
      onSend(content);
      editor.commands.clearContent();
    }

    editor?.commands.focus();
  };

  // 파일 첨부: 선택 즉시 멀티파트 폼데이터로 업로드는 해두되, 전송은 Enter/전송 버튼을 누를 때까지 미룬다.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const type: 'image' | 'file' = file.type.startsWith('image/') ? 'image' : 'file';
    const previewUrl = type === 'image' ? URL.createObjectURL(file) : undefined;

    setIsUploading(true);
    try {
      const { fileUrl } = await uploadFile(file);
      setPendingAttachment({ type, fileUrl, fileName: file.name, previewUrl });
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했어요. 다시 시도해주세요.');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
  };

  useEffect(() => {
    return () => {
      if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border-default px-3 py-2 transition-shadow focus-within:shadow-[0_2px_0_0_var(--color-brand-primary)]">
      <Toolbar
        editor={editor}
        onAttachClick={onSendFile ? () => fileInputRef.current?.click() : undefined}
        isAttachDisabled={isUploading || !!pendingAttachment}
      />
      {onSendFile && <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />}
      {(pendingAttachment || isUploading) && (
        <div className="flex items-center gap-2 rounded-md bg-bg-subtle px-2 py-1.5">
          {pendingAttachment?.type === 'image' && pendingAttachment.previewUrl ? (
            <img
              src={pendingAttachment.previewUrl}
              alt={pendingAttachment.fileName}
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-bg-default text-fg-tertiary">
              <Paperclip size={15} />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-fg-secondary">
            {pendingAttachment ? pendingAttachment.fileName : '업로드 중...'}
          </span>
          {pendingAttachment && (
            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="shrink-0 rounded p-1 text-fg-tertiary hover:bg-bg-canvas"
              title="첨부 취소">
              <X size={14} />
            </button>
          )}
        </div>
      )}
      <EditorContent editor={editor} onClick={() => editor?.commands.focus()} />
      <div className="flex items-center justify-end gap-1">
        {onCreateDocument && (
          <button
            type="button"
            onClick={onCreateDocument}
            className="rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle hover:text-fg-primary"
            title="동시문서편집 문서 만들기">
            <FileText size={18} />
          </button>
        )}
        {onOpenAiMinutes && (
          <button
            type="button"
            onClick={onOpenAiMinutes}
            className="rounded-md p-1.5 text-brand-primary hover:bg-bg-subtle"
            title="AI 회의록 생성">
            <Sparkles size={18} />
          </button>
        )}
        {(onCreateDocument || onOpenAiMinutes) && <span className="mx-0.5 h-4 w-px bg-border-default" />}
        <button
          type="button"
          onClick={handleSend}
          disabled={isUploading}
          className="rounded-md p-1.5 text-brand-primary hover:bg-bg-subtle disabled:opacity-40"
          title="전송">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
