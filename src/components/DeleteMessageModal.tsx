import { X, Paperclip, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { Avatar } from '@/components/Avatar';
import type { Message } from '@/types/chat';
import type { RoomMember } from '@/types/room';
import { stripTrailingEmptyParagraphs } from '@/utils/tiptap';
import { DocumentCardNode } from '@/components/DocumentCardNode';

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: Message;
  senderMember?: RoomMember;
}

export function DeleteMessageModal({
  isOpen,
  onClose,
  onConfirm,
  message,
  senderMember,
}: DeleteMessageModalProps) {
  const [render, setRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      requestAnimationFrame(() => {
        setVisible(true);
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
      DocumentCardNode,
      Mention.configure({ HTMLAttributes: { class: 'mention' } }),
    ],
    content: message.content ? stripTrailingEmptyParagraphs(message.content) : { type: 'doc', content: [] },
    editable: false,
    editorProps: {
      attributes: {
        class: 'tiptap-content text-[15px] leading-relaxed',
      },
    },
  });

  if (!render) return null;

  const isImage = message.type === 'image' && !!message.fileUrl;
  const isFile = message.type === 'file' && !!message.fileUrl;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-[480px] overflow-hidden rounded-xl bg-bg-default shadow-2xl transition-all duration-300 ${
          visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-fg-tertiary transition-colors hover:bg-bg-subtle hover:text-fg-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pb-5">
          <h2 className="text-xl font-bold text-fg-primary mb-3">메시지 삭제</h2>
          <p className="text-[15px] text-fg-secondary mb-6">
            이 메시지를 삭제하시겠습니까? 이 작업은 실행 취소할 수 없습니다.
          </p>

          <div className="rounded-lg border border-border-default bg-bg-canvas p-4 shadow-sm flex gap-3 max-h-[300px] overflow-y-auto mb-6">
            <div className="shrink-0 mt-0.5">
              <Avatar
                seed={message.senderId}
                imageUrl={senderMember?.profileImageUrl}
                alt={message.senderName}
                size={36}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold text-[15px] text-fg-primary">{message.senderName}</span>
                <span className="text-xs text-fg-tertiary">{message.time}</span>
              </div>
              <div className="min-w-0 break-words text-fg-primary">
                {isImage ? (
                  <img
                    src={message.fileUrl!}
                    alt={message.fileName ?? '이미지'}
                    className="max-h-48 max-w-[240px] rounded-md object-cover mt-1"
                  />
                ) : isFile ? (
                  <div className="flex w-full max-w-[280px] items-center gap-2.5 rounded-lg border border-border-default bg-bg-default px-3 py-2 mt-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand-primary">
                      <Paperclip size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg-primary">
                        {message.fileName || '파일'}
                      </span>
                    </span>
                    <Download size={14} className="shrink-0 text-fg-tertiary" />
                  </div>
                ) : (
                  <EditorContent editor={editor} />
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-5 py-2.5 text-[15px] font-semibold text-fg-primary hover:underline transition-all"
            >
              취소
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="rounded-lg bg-error px-6 py-2.5 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-error/90 hover:shadow-error/30 active:scale-95"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
