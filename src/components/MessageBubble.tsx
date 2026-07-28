import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { MoreVertical, Trash2, Check, Download, Paperclip } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Message } from '@/types/chat';
import type { RoomMember } from '@/types/room';
import { stripTrailingEmptyParagraphs, markSelfMentions } from '@/utils/tiptap';
import { DocumentCardNode } from '@/components/DocumentCardNode';
import { MentionHoverCard } from '@/components/MentionHoverCard';
import { Avatar } from '@/components/Avatar';
import { DeleteMessageModal } from '@/components/DeleteMessageModal';
import { getCurrentUserId } from '@/constants/auth';

const AVATAR_COLUMN_WIDTH = 28;

interface MessageBubbleProps {
  message: Message;
  onDelete: (messageId: string) => void;
  /** true면 카톡 캡쳐처럼 메시지를 클릭해 범위 선택할 수 있는 모드 */
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (messageId: string) => void;
  /** 메시지 안의 "@멘션"에 호버했을 때 보여줄 프로필 카드 + 상대방 아바타 표시용 방 멤버 목록 */
  roomMembers?: RoomMember[];
  mentionCandidates?: RoomMember[];
  /** 다른 사람의 멘션 카드에서 "메시지 보내기"를 눌렀을 때 호출 */
  onStartDirectMessage?: (userId: string) => void;

  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  onDelete,
  selectable = false,
  isSelected = false,
  onToggleSelect,
  roomMembers,
  mentionCandidates,
  onStartDirectMessage,
  showAvatar = true,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hoveredMention, setHoveredMention] = useState<{ userId: string; rect: DOMRect } | null>(null);
  const hideTimeoutRef = useRef<number>();

  const senderMember = roomMembers?.find((m) => m.userId === message.senderId);
  // 멘션 대상은 방 멤버가 아닐 수 있으므로 mentionCandidates(가입된 모든 사람)를 우선 찾고,
  // 없으면 roomMembers에서 찾는다.
  const findMentionedMember = (userId: string) =>
    mentionCandidates?.find((m) => m.userId === userId) ?? roomMembers?.find((m) => m.userId === userId);
  const shouldShowAvatarColumn = !message.isMine && showAvatar;

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
  };

  const scheduleHideMention = () => {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => setHoveredMention(null), 150);
  };

  const handleMentionMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('[data-type="mention"]') as HTMLElement | null;
    if (!target) return;
    const userId = target.getAttribute('data-id');
    if (!userId) return;
    clearHideTimeout();
    setHoveredMention({ userId, rect: target.getBoundingClientRect() });
  };

  const handleMentionMouseOut = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('[data-type="mention"]');
    if (!target) return;
    scheduleHideMention();
  };

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
        class: 'tiptap-content text-sm',
      },
    },
  });

  const isDocumentCardOnly =
    message.content?.content?.length === 1 && message.content.content[0]?.type === 'documentCard';

  useEffect(() => {
    if (!editor) return;
    markSelfMentions(editor.view.dom as HTMLElement, getCurrentUserId());
  }, [editor, message.content]);

  const isImage = message.type === 'image' && !!message.fileUrl;
  const isFile = message.type === 'file' && !!message.fileUrl;
  const isBareContent = isDocumentCardOnly || isImage || isFile;

  if (message.isDeleted) {
    return (
      <div className={`flex w-full items-end gap-2 ${message.isMine ? 'justify-end' : ''}`}>
        {!message.isMine && (
          <div className="shrink-0 self-start" style={{ width: AVATAR_COLUMN_WIDTH }}>
            {shouldShowAvatarColumn && (
              <Avatar
                seed={message.senderId}
                imageUrl={senderMember?.profileImageUrl}
                alt={message.senderName}
                size={AVATAR_COLUMN_WIDTH}
              />
            )}
          </div>
        )}
        <div className={`flex min-w-0 flex-1 flex-col ${message.isMine ? 'items-end' : 'items-start'}`}>
          <div className={`flex w-full min-w-0 items-end gap-1.5 ${message.isMine ? 'flex-row-reverse' : ''}`}>
            {message.isMine && <div className="h-[22px] w-[22px] shrink-0" />}
            <div
              style={{
                display: 'block',
                width: 'fit-content',
                minWidth: '2.25rem',
                maxWidth: '60%',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
              className="rounded-lg px-4 py-2 text-sm italic text-fg-tertiary bg-bg-subtle">
              이 메시지가 삭제되었습니다.
            </div>
            {/* 삭제된 메시지는 시간을 보여주지 않는다 (호버해도 안 나옴). 자리만 예약해서 정렬은 맞춘다. */}
            <span className="shrink-0 whitespace-nowrap text-xs text-fg-tertiary opacity-0">{message.time}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex w-full items-end gap-2 ${message.isMine ? 'justify-end' : ''} ${
        selectable ? 'cursor-pointer' : ''
      }`}
      onClick={() => {
        if (selectable) onToggleSelect?.(message.id);
      }}>
      {!message.isMine && (
        <div
          className="shrink-0 cursor-pointer self-start"
          style={{ width: AVATAR_COLUMN_WIDTH }}
          onMouseEnter={(e) => {
            clearHideTimeout();
            setHoveredMention({ userId: message.senderId, rect: e.currentTarget.getBoundingClientRect() });
          }}
          onMouseLeave={scheduleHideMention}>
          {shouldShowAvatarColumn && (
            <Avatar
              seed={message.senderId}
              imageUrl={senderMember?.profileImageUrl}
              presence={senderMember?.presence?.status}
              alt={message.senderName}
              size={AVATAR_COLUMN_WIDTH}
              showPresence={false}
            />
          )}
        </div>
      )}

      <div className={`flex min-w-0 flex-1 flex-col ${message.isMine ? 'items-end' : 'items-start'}`}>
        {shouldShowAvatarColumn && (
          <span className="mb-0.5 px-1 text-xs font-medium text-fg-tertiary">{message.senderName}</span>
        )}

        <div className={`flex w-full min-w-0 items-end gap-1.5 ${message.isMine ? 'flex-row-reverse' : ''}`}>
          {selectable && (
            <span
              className={`flex h-4 w-4 shrink-0 self-center items-center justify-center rounded-full border transition-colors ${
                isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-border-default bg-bg-default'
              }`}>
              {isSelected && <Check size={10} />}
            </span>
          )}

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
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-error hover:bg-bg-subtle">
                    <Trash2 size={14} />
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            onMouseOver={handleMentionMouseOver}
            onMouseOut={handleMentionMouseOut}
            style={
              isBareContent
                ? undefined
                : {
                    width: 'fit-content',
                    minWidth: '2.25rem',
                    wordBreak: 'keep-all',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: message.isMine ? 'var(--color-bg-pressed)' : 'var(--color-brand-soft)',
                    color: 'var(--color-fg-primary)',
                  }
            }
            className={
              isBareContent
                ? 'shrink-0'
                : `min-w-0 max-w-[75%] rounded-lg px-4 py-2 text-sm transition-shadow
       sm:max-w-[70%] lg:max-w-[60%]
       ${isSelected ? 'ring-2 ring-brand-primary' : ''}`
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
                  <span className="block truncate text-sm font-medium text-fg-primary">
                    {message.fileName || '파일'}
                  </span>
                  <span className="block text-xs text-fg-tertiary">눌러서 파일 열기</span>
                </span>
                <Download size={14} className="shrink-0 text-fg-tertiary" />
              </a>
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>

          {hoveredMention && (
            <MentionHoverCard
              userId={hoveredMention.userId}
              anchorRect={hoveredMention.rect}
              member={findMentionedMember(hoveredMention.userId)}
              onMouseEnterCard={clearHideTimeout}
              onMouseLeaveCard={scheduleHideMention}
              onStartDirectMessage={onStartDirectMessage}
            />
          )}

          <span className="shrink-0 whitespace-nowrap text-xs text-fg-tertiary opacity-0 transition-opacity group-hover:opacity-100">
            {message.time}
          </span>
        </div>
      </div>

      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDelete(message.id)}
        message={message}
        senderMember={senderMember}
      />
    </div>
  );
}
