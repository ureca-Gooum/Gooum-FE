// src/components/MessageBubble.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  onDelete: (messageId: string) => void;
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: message.content,
    editable: false,
  });

  if (message.isDeleted) {
    return (
      <div className={`flex flex-col ${message.isMine ? 'items-end' : 'items-start'}`}>
        <div
          style={{ display: 'inline-block', maxWidth: '60%', wordBreak: 'break-word' }}
          className="rounded-lg px-4 py-2 text-sm italic text-fg-tertiary bg-bg-subtle">
          이 메시지가 삭제되었습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex flex-col ${message.isMine ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-1 ${message.isMine ? 'flex-row-reverse' : ''}`}>
        <div
          style={{
            display: 'inline-block',
            maxWidth: '60%',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            backgroundColor: message.isMine ? 'var(--color-brand-soft)' : 'var(--color-bg-canvas)',
            color: 'var(--color-fg-primary)',
          }}
          className="rounded-lg px-4 py-2 text-sm">
          <EditorContent editor={editor} />
        </div>

        {message.isMine && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-bg-canvas">
              <MoreVertical size={14} className="text-fg-tertiary" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 z-10 w-32 rounded-lg border border-border-default bg-bg-default shadow-md p-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(message.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-error hover:bg-bg-subtle">
                  <Trash2 size={14} />
                  삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <span className="mt-1 text-xs text-fg-tertiary opacity-0 transition-opacity group-hover:opacity-100">
        {message.time}
      </span>
    </div>
  );
}
