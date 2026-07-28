import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Loader2, FileText, ArrowRight } from 'lucide-react';
import { createAiSummaryClientOnly } from '@/api/documents';
import { buildTranscript, buildPreviousMinutesRefs } from '@/utils/aiSummary';
import type { Document } from '@/types/document';
import type { Message } from '@/types/chat';

interface AiMinutesModalProps {
  roomId: string;
  messages: Message[];
  onClose: () => void;
  onCreated: (doc: Document, meta: { roomId: string; title: string; transcript: string }) => void;
  onGoToChat?: () => void;
}

function defaultTitle() {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}.${m}.${d} 대화 요약`;
}

export function AiMinutesModal({ roomId, messages, onClose, onCreated, onGoToChat }: AiMinutesModalProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMessages = messages.length > 0;
  const attachmentCount = messages.filter(
    (m) => !m.isDeleted && (m.type === 'image' || m.type === 'file') && !!m.fileUrl,
  ).length;
  // 선택 범위에 예전 AI 회의록이 껴 있으면, 그 내용을 다시 요약에 섞지 않고 그냥 "이런 게 있었다"는
  // 참고 링크로만 보여준다 (버튼 눌러서 바로 확인 가능하게).
  const previousMinutesRefs = buildPreviousMinutesRefs(messages);

  const handleGenerate = async () => {
    setError(null);
    if (!hasMessages) {
      setError('선택된 메시지가 없어요. 채팅에서 메시지를 먼저 선택해주세요.');
      return;
    }
    if (!roomId) {
      setError('채팅방 정보를 찾을 수 없어요. 채팅에서 메시지를 선택하는 것부터 다시 시도해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      // title을 비워두면 createAiSummaryClientOnly가 AI의 추천 제목을 대신 써서 문서를 만든다.
      const doc = await createAiSummaryClientOnly({
        roomId,
        title: title.trim(),
        messages,
        customPrompt: customPrompt.trim() || undefined,
      });
      const transcript = buildTranscript(messages);
      if (doc.skippedAttachmentNotes?.length) {
        alert(
          `일부 첨부파일은 분석에 포함하지 못했어요:\n${doc.skippedAttachmentNotes.join('\n')}\n\n나머지 내용으로 회의록을 만들었어요.`,
        );
      }
      onCreated(doc, { roomId, title: doc.title, transcript });
    } catch (err: any) {
      setError(err.message ?? '회의록 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/30 pointer-events-auto">
      <div className="w-[400px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <Sparkles size={15} />
            </span>
            <h3 className="text-[15px] font-semibold text-slate-800">AI 회의록 생성</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        {hasMessages ? (
          <p className="mb-4 text-[13px] text-slate-500">
            채팅에서 선택한 <span className="font-semibold text-blue-600">{messages.length}개</span> 메시지를 요약해서
            새 문서로 만들어 드려요.
            {attachmentCount > 0 && (
              <>
                {' '}
                첨부된 <span className="font-semibold text-blue-600">{attachmentCount}개</span> 파일/이미지도 함께
                읽어서 반영해요.
              </>
            )}
          </p>
        ) : (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
            선택된 메시지가 없어요. 채팅방으로 돌아가서 AI 회의록 버튼으로 요약할 메시지를 먼저 선택해주세요.
            {onGoToChat && (
              <button onClick={onGoToChat} className="mt-2 block font-medium text-red-600 underline underline-offset-2">
                채팅으로 돌아가기
              </button>
            )}
          </div>
        )}

        {previousMinutesRefs.length > 0 && (
          <div className="mb-4 flex flex-col gap-1.5 rounded-lg bg-slate-50 p-2">
            <p className="px-1 text-[11px] text-slate-400">
              선택 범위에 이전 회의록이 포함되어 있어요. 내용은 다시 요약하지 않고, 아래에서 바로 확인할 수 있어요.
            </p>
            {previousMinutesRefs.map((ref) => (
              <button
                key={ref.documentId}
                type="button"
                onClick={() => navigate(`/app/docs?room=${ref.roomId ?? roomId}&document=${ref.documentId}`)}
                className="flex items-center gap-2 rounded-md bg-white px-2.5 py-2 text-left transition-colors hover:bg-slate-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-500">
                  <FileText size={12} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-slate-700">{ref.title}</span>
                <ArrowRight size={12} className="shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        )}

        <label className="mb-3 flex flex-col gap-1 text-[12px] text-slate-500">
          문서 제목 (비워두면 AI가 대화 내용을 보고 추천해요)
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isGenerating}
            placeholder={`예: ${defaultTitle()}`}
            className="rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-slate-700 outline-none focus:border-blue-400"
          />
        </label>

        <label className="mb-4 flex flex-col gap-1 text-[12px] text-slate-500">
          추가 요청사항 (선택)
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder="예: 결정사항 위주로만 정리해줘, 영어로 써줘 등"
            rows={2}
            className="resize-none rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-slate-700 outline-none focus:border-blue-400"
          />
        </label>

        {error && <p className="mb-3 text-[12px] text-red-500">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !hasMessages}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4f8ef7] to-[#5984f9] py-2.5 text-[13px] font-semibold text-white transition-all active:scale-95 disabled:opacity-50">
          {isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {attachmentCount > 0 ? '첨부파일 분석 + 회의록 생성 중...' : '회의록 생성 중...'}
            </>
          ) : (
            <>
              <Sparkles size={14} />
              회의록 생성하기
            </>
          )}
        </button>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
