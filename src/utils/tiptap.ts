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
