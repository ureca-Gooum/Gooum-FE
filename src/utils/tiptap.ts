import type { TiptapDoc, TiptapNode } from '@/types/chat';

function extractTextFromNode(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractTextFromNode).join('');
}

function isEmptyParagraph(node: TiptapNode | undefined): boolean {
  return !!node && node.type === 'paragraph' && (!node.content || node.content.length === 0);
}

/**
 * 코드 블록/목록 뒤에서 커서를 빠져나오려고 Enter(또는 아래 화살표)를 치면 Tiptap이
 * 편집 편의를 위해 빈 문단을 자동으로 하나 붙여준다. 편집 중에는 필요하지만, 그대로
 * 전송/렌더링하면 말풍선 안에 실제 내용 없는 빈 줄만큼 여백이 남는다. 문서 맨 끝에
 * 연속으로 붙은 빈 문단들을 잘라내서 그 여백을 없앤다.
 */
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

/**
 * 채팅 리스트에 보여줄 마지막 메시지 미리보기 문자열을 만든다.
 * 텍스트 메시지는 본문을, 이미지/파일 메시지는 안내 문구를 반환한다.
 */
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
