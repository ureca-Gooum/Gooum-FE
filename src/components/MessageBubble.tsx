import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { MoreVertical, Trash2, Check, Download, Paperclip } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '@/types/chat';
import { DocumentCardNode } from '@/components/DocumentCardNode';

interface MessageBubbleProps {
  message: Message;
  onDelete: (messageId: string) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  onDelete,
  selectable = false,
  isSelected = false,
  onToggleSelect,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: true, autolink: true }), DocumentCardNode],
    content: message.content ?? { type: 'doc', content: [] },
    editable: false,
    editorProps: {
      attributes: {
        class: 'tiptap-content text-sm',
      },
    },
  });

  const isDocumentCardOnly =
    message.content?.content?.length === 1 && message.content.content[0]?.type === 'documentCard';
  const isImage = message.type === 'image' && !!message.fileUrl;
  const isFile = message.type === 'file' && !!message.fileUrl;
  const isBareContent = isDocumentCardOnly || isImage || isFile;

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
    <div
      className={`group flex flex-col ${message.isMine ? 'items-end' : 'items-start'} ${
        selectable ? 'cursor-pointer' : ''
      }`}
      onClick={() => {
        if (selectable) onToggleSelect?.(message.id);
      }}>
      <div className={`flex items-center gap-1.5 ${message.isMine ? 'flex-row-reverse' : ''}`}>
        {selectable && (
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
              isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-border-default bg-bg-default'
            }`}>
            {isSelected && <Check size={10} />}
          </span>
        )}

        <div
          style={
            isBareContent
              ? undefined
              : {
                  display: 'inline-block',
                  maxWidth: '60%',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: message.isMine ? 'var(--color-brand-soft)' : 'var(--color-bg-pressed)',
                  color: 'var(--color-fg-primary)',
                }
          }
          className={
            isBareContent
              ? ''
              : `rounded-lg px-4 py-2 text-sm transition-shadow ${isSelected ? 'ring-2 ring-brand-primary' : ''}`
          }>
          {isImage ? (
            <img
              src={message.fileUrl!}
              alt={message.fileName ?? '이미지'}
              onClick={() => window.open(message.fileUrl!, '_blank')}
              className={`max-h-72 max-w-[240px] cursor-pointer rounded-lg object-cover ${
                isSelected ? 'ring-2 ring-brand-primary' : ''
              }`}
            />
          ) : isFile ? (
            <a
              href={message.fileUrl!}
              download={message.fileName ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex w-full max-w-[280px] items-center gap-2.5 rounded-xl border border-border-default bg-bg-default px-3.5 py-3 text-left transition-colors hover:bg-bg-subtle ${
                isSelected ? 'ring-2 ring-brand-primary' : ''
              }`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-primary">
                <Paperclip size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg-primary">{message.fileName || '파일'}</span>
                <span className="block text-xs text-fg-tertiary">눌러서 파일 열기</span>
              </span>
              <Download size={14} className="shrink-0 text-fg-tertiary" />
            </a>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>

        {!selectable && message.isMine && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-bg-canvas">
              <MoreVertical size={14} className="text-fg-tertiary" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 z-10 w-32 rounded-lg border border-border-default bg-bg-default shadow-md p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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
