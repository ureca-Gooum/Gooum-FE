import { useEffect, useState } from 'react';
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
  Sparkles,
  Send,
} from 'lucide-react';
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
    // 클릭 시 에디터가 포커스를 잃고 선택 영역이 풀리는 것을 방지
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={label}
    className={`rounded-md p-1.5 text-fg-tertiary transition-colors hover:bg-bg-subtle ${
      isActive ? 'bg-bg-subtle text-fg-primary' : ''
    }`}>
    {children}
  </button>
);

const Toolbar = ({ editor }: { editor: Editor | null }) => {
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
    </div>
  );
};

interface ChatMessageInputProps {
  /** 전송 버튼 클릭 또는 Enter 입력 시 호출. Tiptap JSON 문서를 그대로 넘겨준다. */
  onSend: (content: TiptapDoc) => void;
  /** 입력 중일 때마다 호출 (타이핑 인디케이터용) */
  onTyping?: () => void;
  /** AI 회의록 버튼. 넘기지 않으면 버튼이 렌더링되지 않는다. */
  onOpenAiMinutes?: () => void;
  placeholder?: string;
}

/**
 * 채팅방 하단 메시지 입력창.
 * - Enter: 메시지 전송
 * - Shift+Enter: 줄바꿈 (Tiptap StarterKit의 HardBreak 기본 단축키)
 * - 에디터, AI 버튼, 전송 버튼이 하나의 테두리 박스 안에 함께 배치된다.
 */
export const ChatMessageInput = ({
  onSend,
  onTyping,
  onOpenAiMinutes,
  placeholder = '메시지를 입력하세요.',
}: ChatMessageInputProps) => {
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
        class: 'chat-input-editor max-h-40 min-h-[24px] overflow-y-auto text-sm text-fg-primary outline-none',
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

  // 커서 위치나 선택 영역이 바뀔 때마다 툴바를 다시 그려서 "굵게/기울임/링크 등이 지금 켜져 있는지"가
  // 실시간으로 반영되도록 한다. (isActive()는 스냅샷이라 별도로 리렌더를 걸어줘야 함)
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
    if (!editor || editor.isEmpty) return;
    const content = editor.getJSON() as TiptapDoc;
    onSend(content);
    editor.commands.clearContent();
    editor.commands.focus();
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border-default px-3 py-2 transition-shadow focus-within:shadow-[0_2px_0_0_var(--color-brand-primary)]">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} onClick={() => editor?.commands.focus()} />
      <div className="flex items-center justify-end gap-1">
        {onOpenAiMinutes && (
          <button
            type="button"
            onClick={onOpenAiMinutes}
            className="rounded-md p-1.5 text-brand-primary hover:bg-bg-subtle"
            title="AI 회의록 생성">
            <Sparkles size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={handleSend}
          className="rounded-md p-1.5 text-brand-primary hover:bg-bg-subtle"
          title="전송">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
