import { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Sparkles, RefreshCw, Type, Loader2 } from 'lucide-react';
import { callGeminiForMinutes } from '@/utils/aiSummary';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiMinutesBlock: {
      insertAiMinutesBlock: (content?: any[], attrs?: Record<string, any>) => ReturnType;
      unwrapAiMinutesBlock: (pos: number) => ReturnType;
      setAiMinutesBlockStatus: (pos: number, status: 'streaming' | 'done') => ReturnType;
    };
  }
}

function formatGeneratedAt(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function AiMinutesBlockView({ node, editor, getPos, updateAttributes }: NodeViewProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const status: 'streaming' | 'done' = node.attrs.status ?? 'done';
  const isStreaming = status === 'streaming' || isRegenerating;

  const handleConvertToText = () => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos === null || pos === undefined) return;
    editor.chain().focus().unwrapAiMinutesBlock(pos).run();
  };

  const handleRegenerate = async () => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos === null || pos === undefined || isRegenerating) return;

    const { title, transcript } = node.attrs as { title: string | null; transcript: string | null };
    if (!transcript) return;

    setIsRegenerating(true);
    updateAttributes({ status: 'streaming' });

    try {
      const newContent = await callGeminiForMinutes(transcript, title ?? '회의록');
      const newBlocks =
        newContent.content && newContent.content.length > 0 ? newContent.content : [{ type: 'paragraph' }];

      editor
        .chain()
        .command(({ tr }) => {
          const current = tr.doc.nodeAt(pos);
          if (!current) return false;
          const from = pos + 1;
          const to = pos + current.nodeSize - 1;
          const fragment = editor.schema.nodeFromJSON({ type: 'doc', content: newBlocks }).content;
          tr.replaceWith(from, to, fragment);
          tr.setNodeMarkup(pos, undefined, { ...current.attrs, status: 'done', generatedAt: new Date().toISOString() });
          return true;
        })
        .run();
    } catch (err) {
      console.error('회의록 재생성 실패:', err);
      updateAttributes({ status: 'done' });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <NodeViewWrapper
      className="ai-minutes-block group relative my-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3"
      data-status={status}>
      <div className="mb-2 flex items-center justify-between gap-2" contentEditable={false}>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600">
          <Sparkles size={13} />
          <span>AI 생성됨</span>
          {!isStreaming && node.attrs.generatedAt && (
            <span className="font-normal text-slate-400">· {formatGeneratedAt(node.attrs.generatedAt)}</span>
          )}
        </div>

        {isStreaming ? (
          <span className="flex items-center gap-1 text-[12px] text-slate-400">
            <Loader2 size={12} className="animate-spin" />
            생성 중...
          </span>
        ) : (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={handleRegenerate}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-white hover:text-blue-600"
              title="같은 조건으로 다시 생성">
              <RefreshCw size={11} />
              다시 생성
            </button>
            <button
              type="button"
              onClick={handleConvertToText}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-white hover:text-blue-600"
              title="박스를 해제하고 일반 텍스트로 남기기">
              <Type size={11} />
              텍스트로 변환
            </button>
          </div>
        )}
      </div>

      <NodeViewContent
        className={`ai-minutes-block-content text-[14px] leading-relaxed text-slate-700 ${isStreaming ? 'pointer-events-none opacity-60' : ''}`}
      />
    </NodeViewWrapper>
  );
}

export const AiMinutesBlock = Node.create({
  name: 'aiMinutesBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      status: {
        default: 'done',
        parseHTML: (el) => el.getAttribute('data-status') ?? 'done',
        renderHTML: (attrs) => ({ 'data-status': attrs.status }),
      },
      generatedAt: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-generated-at'),
        renderHTML: (attrs) => (attrs.generatedAt ? { 'data-generated-at': attrs.generatedAt } : {}),
      },
      roomId: { default: null },
      title: { default: null },
      transcript: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-transcript') ?? '',
        renderHTML: (attrs) => ({ 'data-transcript': attrs.transcript ?? '' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="ai-minutes-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-minutes-block' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiMinutesBlockView);
  },

  addCommands() {
    return {
      insertAiMinutesBlock:
        (content, attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { status: 'done', generatedAt: new Date().toISOString(), ...attrs },
              content: content && content.length > 0 ? content : [{ type: 'paragraph' }],
            })
            .run();
        },
      unwrapAiMinutesBlock:
        (pos) =>
        ({ tr, dispatch }) => {
          const node = tr.doc.nodeAt(pos);
          if (!node || node.type.name !== this.name) return false;
          if (dispatch) {
            tr.replaceWith(pos, pos + node.nodeSize, node.content);
          }
          return true;
        },
      setAiMinutesBlockStatus:
        (pos, status) =>
        ({ tr, dispatch }) => {
          const node = tr.doc.nodeAt(pos);
          if (!node || node.type.name !== this.name) return false;
          if (dispatch) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, status });
          }
          return true;
        },
    };
  },
});
