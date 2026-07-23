import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function DocumentCardView({ node }: NodeViewProps) {
  const navigate = useNavigate();
  const { documentId, title, roomId } = node.attrs as {
    documentId: string | null;
    title: string | null;
    roomId: string | null;
  };

  const handleClick = () => {
    if (!documentId) return;
    navigate(`/app/docs?room=${roomId ?? ''}&document=${documentId}`);
  };

  return (
    <NodeViewWrapper contentEditable={false} className="my-0.5 block w-full max-w-[280px]">
      <div
        role="button"
        onClick={handleClick}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border-default bg-bg-default px-3.5 py-3 text-left transition-colors hover:bg-bg-subtle cursor-pointer">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-primary">
          <FileText size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg-primary">{title || '회의록'}</span>
          <span className="block text-xs text-fg-tertiary">AI 회의록 · 눌러서 문서 열기</span>
        </span>
        <ArrowRight size={14} className="shrink-0 text-fg-tertiary" />
      </div>
    </NodeViewWrapper>
  );
}

/**
 * 채팅 메시지 안에 삽입되어 특정 문서로 이동하는 카드를 렌더링하는 노드.
 * Teams의 "Loop 구성 요소" 카드와 동일한 역할 — 메시지 콘텐츠(JSON) 안에 이 노드 하나만 넣어서 전송한다.
 */
export const DocumentCardNode = Node.create({
  name: 'documentCard',
  group: 'block',
  atom: true, // 내부에 편집 가능한 콘텐츠가 없는 통짜 블록
  selectable: false,

  addAttributes() {
    return {
      documentId: { default: null },
      title: { default: '' },
      roomId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="document-card"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'document-card' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentCardView);
  },
});
