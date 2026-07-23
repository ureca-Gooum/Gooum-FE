import type { TiptapDoc, TiptapNode, Message } from '@/types/chat';
import { extractPreviewText } from '@/utils/tiptap';

// Vite는 `VITE_` 접두사가 붙은 환경변수만 클라이언트 번들에 노출한다.
// ⚠️ 이 키는 빌드된 JS에 그대로 포함되어 누구나 볼 수 있다 (개발/데모용으로만 사용 권장).
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Gemini가 반환해야 하는 구조화된 회의록 스키마
interface AiSummaryResult {
  title: string;
  summary: string;
  decisions: string[];
  actionItems: { task: string; assignee: string | null }[];
  codeSnippets: { language: string; code: string; description: string }[];
  unresolvedQuestions: string[];
}

const SYSTEM_INSTRUCTION = `당신은 팀 채팅 대화를 분석해서 업무 보고서 형식의 회의록을 작성하는 전문가입니다.
아래 채팅 대화를 분석해서, 반드시 아래 JSON 형식으로만 응답하세요.
설명이나 다른 텍스트 없이 JSON만 출력하세요.
{
  "title": "회의록 제목 (예: 7/23 채팅 실시간 연동 논의)",
  "summary": "핵심 내용 2~3문장 요약",
  "decisions": ["대화에서 확정된 결정사항들, 없으면 빈 배열"],
  "actionItems": [
    { "task": "해야 할 일", "assignee": "담당자 이름 (언급 안 됐으면 null)" }
  ],
  "codeSnippets": [
    { "language": "프로그래밍 언어명", "code": "실제 코드", "description": "이 코드가 뭔지 한 줄 설명" }
  ],
  "unresolvedQuestions": ["아직 답이 안 나온 질문이나 논의가 필요한 사항들"]
}
규칙:
- 채팅은 반말, 줄임말, 이모지가 섞여 있을 수 있습니다. 이를 정제해서 표준 업무 보고서 톤(정중하고 간결한 문어체)으로 작성하세요.
- 실제로 대화에 없는 내용을 추측해서 만들어내지 마세요. 확실하지 않으면 해당 항목을 비워두세요.
- 농담이나 잡담은 요약에서 제외하고, 실질적인 논의/결정/할 일에만 집중하세요.
- 대화에 실제 코드가 그대로 붙여넣기 된 경우에만 codeSnippets에 포함하세요.
- 에러 메시지, 스택트레이스, 콘솔/터미널 로그가 그대로 붙여넣기 된 경우에도 codeSnippets에 포함하세요.
  language는 "log"로 표기하고, description에 어떤 상황에서 발생한 에러인지 요약하세요.
  원문(URL, 포트 번호, ID 값 등)을 절대 요약하거나 바꿔쓰지 말고 그대로 code 필드에 담으세요.
- 코드를 말로 설명한 것(예: "join 함수에서 콜백 빠진 거 같아요")은 codeSnippets이 아니라 actionItems나 unresolvedQuestions에 텍스트로 정리하세요.
- 코드 언어는 문맥(파일 확장자, 문법 등)으로 판단해서 정확히 표기하세요 (예: typescript, javascript, python).
- 사람 이름은 대화에서 실제로 언급된 이름을 그대로 사용하세요.`;

/**
 * 선택된 메시지들을 "[시간] 이름: 내용" 형태의 텍스트로 변환한다.
 * Gemini에게 넘길 대화록 원문이자, "다시 생성" 시 재사용할 원본 텍스트가 된다.
 */
export function buildTranscript(messages: Message[]): string {
  return messages
    .filter((m) => !m.isDeleted)
    .map((m) => `[${m.time}] ${m.senderName}: ${extractPreviewText(m.content) || '(내용 없음)'}`)
    .join('\n');
}

function parseAiSummaryResult(rawText: string): AiSummaryResult {
  // 혹시 ```json ... ``` 형태로 감싸서 응답한 경우를 대비해 코드블록 표시를 제거
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    // 필드가 비어있거나 타입이 안 맞아도 죽지 않도록 하나씩 방어적으로 채운다
    return {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : '회의록',
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.filter((d: unknown) => typeof d === 'string') : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems
            .filter((a: any) => a && typeof a.task === 'string')
            .map((a: any) => ({ task: a.task, assignee: typeof a.assignee === 'string' ? a.assignee : null }))
        : [],
      codeSnippets: Array.isArray(parsed.codeSnippets)
        ? parsed.codeSnippets
            .filter((c: any) => c && typeof c.code === 'string')
            .map((c: any) => ({
              language: typeof c.language === 'string' && c.language ? c.language : 'text',
              code: c.code,
              description: typeof c.description === 'string' ? c.description : '',
            }))
        : [],
      unresolvedQuestions: Array.isArray(parsed.unresolvedQuestions)
        ? parsed.unresolvedQuestions.filter((q: unknown) => typeof q === 'string')
        : [],
    };
  } catch {
    // JSON 파싱 자체에 실패하면, 받은 텍스트를 그대로 summary에 담아 최소한 내용은 보이게 한다
    return {
      title: '회의록',
      summary: rawText.trim() || '요약 결과를 가져오지 못했어요.',
      decisions: [],
      actionItems: [],
      codeSnippets: [],
      unresolvedQuestions: [],
    };
  }
}

function heading(level: 1 | 2, text: string): TiptapNode {
  return { type: 'heading', attrs: { level }, content: text ? [{ type: 'text', text }] : [] };
}

function paragraph(text: string): TiptapNode {
  return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] };
}

function bulletList(items: string[]): TiptapNode {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph(item)],
    })),
  };
}

/**
 * 구조화된 AI 요약 결과(AiSummaryResult)를 Tiptap 문서(JSON)로 변환한다.
 * 값이 비어있는 섹션(예: decisions가 빈 배열)은 아예 만들지 않는다.
 */
function summaryResultToTiptapDoc(result: AiSummaryResult): TiptapDoc {
  const content: TiptapNode[] = [heading(1, result.title)];

  if (result.summary) {
    content.push(heading(2, '요약'));
    content.push(paragraph(result.summary));
  }

  if (result.decisions.length > 0) {
    content.push(heading(2, '결정 사항'));
    content.push(bulletList(result.decisions));
  }

  if (result.actionItems.length > 0) {
    content.push(heading(2, '액션 아이템'));
    content.push(bulletList(result.actionItems.map((a) => (a.assignee ? `${a.assignee}: ${a.task}` : a.task))));
  }

  if (result.codeSnippets.length > 0) {
    content.push(heading(2, '코드 스니펫'));
    for (const snippet of result.codeSnippets) {
      if (snippet.description) content.push(paragraph(snippet.description));
      content.push({
        type: 'codeBlock',
        attrs: { language: snippet.language },
        content: [{ type: 'text', text: snippet.code }],
      });
    }
  }

  if (result.unresolvedQuestions.length > 0) {
    content.push(heading(2, '미해결 사항'));
    content.push(bulletList(result.unresolvedQuestions));
  }

  return { type: 'doc', content };
}

/**
 * Gemini API를 브라우저에서 직접 호출해 대화록(transcript)을 구조화된 회의록 Tiptap JSON으로 변환한다.
 * title 파라미터는 문서 메타데이터(사이드바 표시용 제목)로만 쓰이고, 문서 안 제목(heading1)은
 * AI가 대화 내용을 보고 직접 지어낸 result.title을 사용한다.
 */
export async function callGeminiForMinutes(transcript: string, _title: string): Promise<TiptapDoc> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API 키가 설정되지 않았어요. .env 파일의 VITE_GEMINI_API_KEY를 확인해주세요.');
  }
  if (!transcript.trim()) {
    throw new Error('요약할 대화 내용이 없어요.');
  }

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n대화 내용:\n${transcript}` }],
        },
      ],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API 호출에 실패했어요. (${res.status}) ${errText}`.trim());
  }

  const data = await res.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const result = parseAiSummaryResult(rawText);
  return summaryResultToTiptapDoc(result);
}
