import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles } from 'lucide-react';
import { getDocuments } from '@/api/documents';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatDateShort } from '@/utils/formatTime';
import type { Document } from '@/types/document';

interface RoomDocumentsTabProps {
  roomId: string;
}

function getAuthorName(createdBy: Document['createdBy']): string {
  if (!createdBy) return '알 수 없음';
  return typeof createdBy === 'string' ? createdBy : createdBy.name;
}

const TYPE_LABEL: Record<string, string> = {
  document: '문서',
  ai_summary: 'AI 회의록',
};

/**
 * 채팅방 상단 "문서" 탭 콘텐츠.
 * 전체 문서함이 아니라, 이 방(roomId)에서 만들어진 문서/AI 회의록만 보여준다.
 * getDocuments(roomId)로 서버에도 이 방 기준으로 요청하지만, 혹시 모를 다른 타입/다른 방
 * 문서가 섞여 오는 경우를 대비해 한 번 더 클라이언트에서 걸러낸다.
 * 항목을 누르면 DocsPage에서 바로 그 문서를 열어준다 (DocumentCardNode와 동일한 이동 방식).
 */
export function RoomDocumentsTab({ roomId }: RoomDocumentsTabProps) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getDocuments(roomId)
      .then((res) => {
        if (!isMounted) return;
        const roomOnly = res.documents.filter(
          (doc) => (!doc.roomId || doc.roomId === roomId) && (doc.type === 'document' || doc.type === 'ai_summary'),
        );
        const sorted = roomOnly.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setDocuments(sorted);
      })
      .catch((err) => console.error('문서 목록을 불러오지 못했어요:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-fg-tertiary">
        <FileText size={28} strokeWidth={1.5} />
        <p className="text-sm">이 채팅방에서 만든 문서가 없어요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {documents.map((doc) => {
        const isAiSummary = doc.type === 'ai_summary';
        return (
          <button
            key={doc.documentId}
            onClick={() => navigate(`/app/docs?room=${roomId}&document=${doc.documentId}`)}
            className="flex w-full items-center gap-3 rounded-lg px-1.5 py-3 text-left transition-colors hover:bg-bg-subtle">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-primary">
              {isAiSummary ? <Sparkles size={16} /> : <FileText size={16} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg-primary">
                {doc.title || '제목 없는 문서'}
              </span>
              <span className="block truncate text-xs text-fg-tertiary">
                {TYPE_LABEL[doc.type] ?? '문서'} · {getAuthorName(doc.createdBy)}
              </span>
            </span>
            <span className="shrink-0 text-xs text-fg-tertiary">{formatDateShort(doc.updatedAt)}</span>
          </button>
        );
      })}
    </div>
  );
}
