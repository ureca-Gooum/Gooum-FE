import type { TiptapDoc, TiptapNode } from '@/types/chat';

function extractTextFromNode(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractTextFromNode).join('');
}

export function extractPreviewText(doc: TiptapDoc | null | undefined): string {
  if (!doc?.content) return '';
  return doc.content.map(extractTextFromNode).join(' ').trim();
}

/**
 * 채팅 리스트에 보여줄 마지막 메시지 미리보기 문자열을 만든다.
 * 텍스트 메시지는 본문을, 이미지/파일 메시지는 안내 문구를 반환한다.
 */
export function buildLastMessagePreview(params: {
  type: 'text' | 'image' | 'file';
  content: TiptapDoc | null;
  fileName: string | null;
}): string {
  if (params.type === 'image') return '사진을 보냈습니다';
  if (params.type === 'file') return params.fileName ? `${params.fileName} 파일을 보냈습니다` : '파일을 보냈습니다';
  return extractPreviewText(params.content) || '메시지';
}

export interface AiMinutesMeta {
  roomId: string;
  title: string;
  /** "다시 생성" 시 서버 없이 동일한 원문으로 Gemini를 다시 호출하기 위해 보관하는 대화록 텍스트 */
  transcript: string;
}

/**
 * AI가 생성한 회의록 콘텐츠(Tiptap JSON)를 문서 최상단에서 한 번만
 * `aiMinutesBlock` 노드로 감싸준다. 이후에는 일반 노드처럼 문서에 저장되므로
 * 다시 불러올 때 이 함수를 또 호출할 필요는 없다 (재호출해도 이미 감싸져 있으면 그대로 반환).
 */
export function wrapAiMinutesContent(content: any, meta: AiMinutesMeta) {
  const blocks = content && typeof content === 'object' && Array.isArray(content.content) ? content.content : [];

  // 이미 AI 박스로 감싸진 콘텐츠라면 중복으로 감싸지 않는다.
  if (blocks.length === 1 && blocks[0]?.type === 'aiMinutesBlock') {
    return content;
  }

  return {
    type: 'doc',
    content: [
      {
        type: 'aiMinutesBlock',
        attrs: {
          status: 'done',
          generatedAt: new Date().toISOString(),
          roomId: meta.roomId,
          title: meta.title,
          transcript: meta.transcript,
        },
        content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }],
      },
    ],
  };
}
