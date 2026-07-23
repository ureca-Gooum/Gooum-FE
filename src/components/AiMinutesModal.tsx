import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { createAiSummaryClientOnly } from '@/api/documents';
import { buildTranscript } from '@/utils/aiSummary';
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
  const [title, setTitle] = useState(defaultTitle());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMessages = messages.length > 0;

  const handleGenerate = async () => {
    setError(null);
    if (!hasMessages) {
      setError('선택된 메시지가 없어요. 채팅에서 메시지를 먼저 선택해주세요.');
      return;
    }

    const finalTitle = title.trim() || defaultTitle();
    setIsGenerating(true);
    try {
      const doc = await createAiSummaryClientOnly({ roomId, title: finalTitle, messages });
      const transcript = buildTranscript(messages);
      onCreated(doc, { roomId, title: finalTitle, transcript });
    } catch (err: any) {
      setError(err.message ?? '회의록 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
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
          </p>
        ) : (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
            선택된 메시지가 없어요. 채팅방으로 돌아가서 sparkle 버튼으로 요약할 메시지를 먼저 선택해주세요.
            {onGoToChat && (
              <button onClick={onGoToChat} className="mt-2 block font-medium text-red-600 underline underline-offset-2">
                채팅으로 돌아가기
              </button>
            )}
          </div>
        )}

        <label className="mb-4 flex flex-col gap-1 text-[12px] text-slate-500">
          문서 제목
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isGenerating}
            placeholder={defaultTitle()}
            className="rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-slate-700 outline-none focus:border-blue-400"
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
              회의록 생성 중...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              회의록 생성하기
            </>
          )}
        </button>
      </div>
    </div>
  );
}
