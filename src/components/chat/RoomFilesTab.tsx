import { useMemo, useState } from 'react';
import { Paperclip, FolderOpen } from 'lucide-react';
import { formatDateShort } from '@/utils/formatTime';
import type { Message } from '@/types/chat';

type FileFilter = 'all' | 'file' | 'image';

/** 이미지 썸네일 고정 크기(px). 반응형으로 줄어들지 않고, 폭에 따라 한 줄에 들어가는 개수만 달라진다. */
const THUMB_SIZE = 88;

const FILTERS: { key: FileFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'file', label: '파일' },
  { key: 'image', label: '이미지' },
];

interface RoomFilesTabProps {
  messages: Message[];
}

/**
 * 채팅방 상단 "파일" 탭 콘텐츠.
 * 채팅 메시지 중 type이 image/file 인 것들만 모아 최신순으로 보여준다.
 * 이미지는 썸네일 그리드로, 파일은 아이콘 + 제목/보낸사람 + 날짜의 리스트로 표시한다.
 */
export function RoomFilesTab({ messages }: RoomFilesTabProps) {
  const [filter, setFilter] = useState<FileFilter>('all');

  const { images, files } = useMemo(() => {
    const attachments = messages.filter(
      (m) => !m.isDeleted && (m.type === 'image' || m.type === 'file') && !!m.fileUrl,
    );
    // 최신 항목이 위로 오도록 뒤집는다 (messages는 오래된 순으로 쌓여있음)
    const reversed = [...attachments].reverse();
    return {
      images: reversed.filter((m) => m.type === 'image'),
      files: reversed.filter((m) => m.type === 'file'),
    };
  }, [messages]);

  const showImages = (filter === 'all' || filter === 'image') && images.length > 0;
  const showFiles = (filter === 'all' || filter === 'file') && files.length > 0;
  const isEmpty = !showImages && !showFiles;
  // 전체 탭에서는 이미지가 한 줄만 보이는 미리보기 형태 + "전체보기" 링크를 보여준다
  const isImagePreview = filter === 'all';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      {/* 필터 */}
      <div className="flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-primary text-white'
                : 'border border-border-default text-fg-secondary hover:bg-bg-subtle'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isEmpty && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-fg-tertiary">
          <FolderOpen size={28} strokeWidth={1.5} />
          <p className="text-sm">{filter === 'image' ? '주고받은 이미지가 없어요.' : '주고받은 파일이 없어요.'}</p>
        </div>
      )}

      {showImages && (
        <div className="flex flex-col gap-2.5">
          {isImagePreview && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-fg-tertiary">이미지 {images.length}</p>
              <button
                onClick={() => setFilter('image')}
                className="text-xs font-medium text-brand-primary hover:underline">
                전체보기
              </button>
            </div>
          )}
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${THUMB_SIZE}px, ${THUMB_SIZE}px))`,
              gridAutoRows: `${THUMB_SIZE}px`,
              ...(isImagePreview ? { height: THUMB_SIZE, overflow: 'hidden' } : {}),
            }}>
            {images.map((msg) => (
              <button
                key={msg.id}
                onClick={() => window.open(msg.fileUrl!, '_blank')}
                className="group relative overflow-hidden rounded-lg bg-bg-subtle"
                title={msg.fileName ?? '이미지'}>
                <img
                  src={msg.fileUrl!}
                  alt={msg.fileName ?? '이미지'}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {showFiles && (
        <div className="flex flex-col gap-1">
          {filter === 'all' && <p className="px-1 text-xs font-medium text-fg-tertiary">파일 {files.length}</p>}
          <div className="flex flex-col">
            {files.map((msg) => (
              <a
                key={msg.id}
                href={msg.fileUrl!}
                download={msg.fileName ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-1.5 py-2.5 transition-colors hover:bg-bg-subtle">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-primary">
                  <Paperclip size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg-primary">{msg.fileName || '파일'}</span>
                  <span className="block truncate text-xs text-fg-tertiary">
                    {msg.senderName} · {msg.createdAt ? formatDateShort(msg.createdAt) : msg.time}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
