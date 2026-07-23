import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { MoreVertical, Trash2, Check, Download, Paperclip } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '@/types/chat';
import { stripTrailingEmptyParagraphs } from '@/utils/tiptap';
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
    // ChatMessageInput에서 사용하는 확장(Underline, Link)을 동일하게 등록해야
    // 해당 마크가 포함된 메시지가 누락되지 않고 그대로 렌더링된다.
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: true, autolink: true }), DocumentCardNode],
    content: message.content ? stripTrailingEmptyParagraphs(message.content) : { type: 'doc', content: [] },
    editable: false,
    editorProps: {
      // 입력창과 같은 클래스를 공유해서 목록(•, 1.)과 코드 블록 스타일이
      // 전송된 메시지에도 동일하게 적용되도록 한다.
      attributes: {
        class: 'tiptap-content text-sm',
      },
    },
  });

  // 메시지 전체가 문서 카드 하나뿐이면, 말풍선 배경/패딩 없이 카드 자체만 보여준다 (Teams Loop 카드 느낌)
  const isDocumentCardOnly =
    message.content?.content?.length === 1 && message.content.content[0]?.type === 'documentCard';
  // 이미지/파일 첨부 메시지도 같은 이유로 말풍선 배경/패딩 없이 그 자체만 보여준다
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
              ? 'shrink-0'
              : `shrink-0 rounded-lg px-4 py-2 text-sm transition-shadow ${isSelected ? 'ring-2 ring-brand-primary' : ''}`
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
