import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { MoreVertical, Trash2, Check } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '@/types/chat';
import { DocumentCardNode } from '@/components/DocumentCardNode';

interface MessageBubbleProps {
  message: Message;
  onDelete: (messageId: string) => void;
  /** true면 카톡 캡쳐처럼 메시지를 클릭해 범위 선택할 수 있는 모드 */
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
    extensions: [StarterKit, DocumentCardNode],
    content: message.content,
    editable: false,
  });

  // 메시지 전체가 문서 카드 하나뿐이면, 말풍선 배경/패딩 없이 카드 자체만 보여준다 (Teams Loop 카드 느낌)
  const isDocumentCardOnly =
    message.content?.content?.length === 1 && message.content.content[0]?.type === 'documentCard';

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
            isDocumentCardOnly
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
            isDocumentCardOnly
              ? ''
              : `rounded-lg px-4 py-2 text-sm transition-shadow ${isSelected ? 'ring-2 ring-brand-primary' : ''}`
          }>
          <EditorContent editor={editor} />
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
