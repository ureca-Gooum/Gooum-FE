import type { TiptapDoc, TiptapNode } from '@/types/chat';

function extractTextFromNode(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractTextFromNode).join('');
}

function isEmptyParagraph(node: TiptapNode | undefined): boolean {
  return !!node && node.type === 'paragraph' && (!node.content || node.content.length === 0);
}

export function stripTrailingEmptyParagraphs(doc: TiptapDoc): TiptapDoc {
  if (!doc?.content || doc.content.length === 0) return doc;

  const content = [...doc.content];
  while (content.length > 1 && isEmptyParagraph(content[content.length - 1])) {
    content.pop();
  }
  return { ...doc, content };
}

export function extractPreviewText(doc: TiptapDoc | null | undefined): string {
  if (!doc?.content) return '';
  return doc.content.map(extractTextFromNode).join(' ').trim();
}

export function extractMentionedUserIds(doc: TiptapDoc | null | undefined): string[] {
  if (!doc?.content) return [];
  const ids = new Set<string>();

  const walk = (node: TiptapNode) => {
    if (node.type === 'mention' && node.attrs?.id) {
      ids.add(node.attrs.id as string);
    }
    node.content?.forEach(walk);
  };

  doc.content.forEach(walk);
  return Array.from(ids);
}

export function buildLastMessagePreview(params: {
  type: 'text' | 'image' | 'file' | 'document' | 'ai_summary';
  content: TiptapDoc | null;
  fileName: string | null;
}): string {
  if (params.type === 'image') return '사진을 보냈습니다';
  if (params.type === 'file') return params.fileName ? `${params.fileName} 파일을 보냈습니다` : '파일을 보냈습니다';
  if (params.type === 'document') return '문서를 보냈습니다';
  if (params.type === 'ai_summary') return 'AI 회의록을 보냈습니다';
  return extractPreviewText(params.content) || '메시지';
}

export interface AiMinutesMeta {
  roomId: string;
  title: string;
  transcript: string;
}

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
