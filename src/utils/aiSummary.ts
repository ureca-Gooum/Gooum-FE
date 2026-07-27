import type { TiptapDoc, TiptapNode, Message } from '@/types/chat';
import { extractPreviewText } from '@/utils/tiptap';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const MAX_ATTACHMENTS = 6;

export interface GeminiInlinePart {
  inline_data: { mime_type: string; data: string };
}

export interface GeminiTextPart {
  text: string;
}

export type GeminiPart = GeminiInlinePart | GeminiTextPart;

export interface CollectedAttachments {
  parts: GeminiPart[];
  /** 실제로 첨부되어 함께 분석된 파일/이미지 이름들 */
  includedNames: string[];
  /** 용량 초과 등으로 첨부하지 못하고 건너뛴 항목에 대한 안내 문구들 */
  skippedNotes: string[];
}

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
- 사람 이름은 대화에서 실제로 언급된 이름을 그대로 사용하세요.
- 대화와 함께 이미지/문서 파일이 첨부되어 있다면, 그 내용(사진 속 글자·화면·표, 문서 안의 텍스트 등)도 실제로 읽고 분석해서
  관련된 부분에 반영하세요. 첨부파일 내용을 요약/결정사항/액션아이템 어디에 반영할지는 문맥에 맞게 판단하세요.
  단, 첨부파일에 없는 내용을 지어내지는 마세요.`;

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 한 번에 너무 많은 바이트를 스프레드하면 콜스택이 넘칠 수 있어 청크로 나눈다
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Gemini가 inline_data로 직접 이해할 수 있는 파일 형식들. 이미지는 type이 'image'인 메시지는 항상 시도하고,
// type이 'file'인 첨부는 이 목록에 있는 확장자일 때만 시도한다.
const SUPPORTED_FILE_EXTENSIONS = new Set(['pdf', 'txt', 'md', 'csv', 'json', 'html', 'js', 'ts', 'py']);

// Gemini API에는 직접 못 넣지만, 프론트에서 텍스트만 추출해서 text part로 넘길 수 있는 형식들
const TEXT_EXTRACTABLE_EXTENSIONS = new Set(['docx', 'xlsx', 'xls']);

function getExtension(fileName: string | null): string {
  return fileName?.split('.').pop()?.toLowerCase() ?? '';
}

/** docx 파일을 순수 텍스트로 변환한다 (mammoth, 브라우저에서 동작). */
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
  return value.trim();
}

/** xlsx/xls 파일의 모든 시트를 "[시트명]\nCSV" 형태의 텍스트로 변환한다 (SheetJS, 브라우저에서 동작). */
function extractXlsxText(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
    return `[시트: ${name}]\n${csv}`;
  })
    .join('\n\n')
    .trim();
}

/** 파일 확장자에 맞는 방식으로 텍스트를 추출한다. 실패하면 null. */
async function extractTextFromFile(buffer: ArrayBuffer, extension: string): Promise<string | null> {
  try {
    if (extension === 'docx') return await extractDocxText(buffer);
    if (extension === 'xlsx' || extension === 'xls') return extractXlsxText(buffer);
    return null;
  } catch {
    // 손상된 파일, 암호 보호된 파일 등 파싱 자체가 실패하는 경우
    return null;
  }
}

/** 파일 하나를 fetch해서 Gemini의 inline_data 파트로 쓸 수 있는 base64로 변환한다. 실패/용량초과 시 null. */
async function fetchAsInlinePart(fileUrl: string): Promise<{ mime_type: string; data: string } | null> {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size === 0 || blob.size > MAX_ATTACHMENT_BYTES) return null;
    const buffer = await blob.arrayBuffer();
    return {
      mime_type: blob.type || 'application/octet-stream',
      data: arrayBufferToBase64(buffer),
    };
  } catch {
    // CORS로 막혀있거나 네트워크 오류인 경우. 이 파일 하나만 건너뛰고 나머지는 계속 진행한다.
    return null;
  }
}

/** docx/xlsx처럼 Gemini에 직접 못 넣는 파일을 fetch해서 원본 ArrayBuffer로 가져온다. 실패/용량초과 시 null. */
async function fetchAsArrayBuffer(fileUrl: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size === 0 || blob.size > MAX_ATTACHMENT_BYTES) return null;
    return await blob.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * 선택된 메시지들 중 이미지/파일 첨부를 모아 Gemini에 함께 보낼 수 있는 형태로 변환한다.
 * 요청이 너무 무거워지지 않도록 최대 개수(MAX_ATTACHMENTS)와 파일당 최대 용량(MAX_ATTACHMENT_BYTES)을 둔다.
 * docx/xlsx는 Gemini API가 직접 못 읽기 때문에, 브라우저에서 텍스트로 변환한 뒤 text part로 넘긴다.
 */
export async function collectAttachmentParts(messages: Message[]): Promise<CollectedAttachments> {
  const candidates = messages.filter((m) => !m.isDeleted && (m.type === 'image' || m.type === 'file') && !!m.fileUrl);
  const limited = candidates.slice(0, MAX_ATTACHMENTS);

  const parts: GeminiPart[] = [];
  const includedNames: string[] = [];
  const skippedNotes: string[] = [];

  for (const m of limited) {
    const label = m.fileName || (m.type === 'image' ? '이미지' : '파일');
    const extension = getExtension(m.fileName);

    // 1) docx/xlsx: 브라우저에서 텍스트로 변환해서 text part로 넘긴다
    if (m.type === 'file' && TEXT_EXTRACTABLE_EXTENSIONS.has(extension)) {
      const buffer = await fetchAsArrayBuffer(m.fileUrl!);
      if (!buffer) {
        skippedNotes.push(`${label} (파일을 가져오지 못했어요 - 파일 서버 접근 권한 문제일 수 있어요)`);
        continue;
      }
      const text = await extractTextFromFile(buffer, extension);
      if (!text) {
        skippedNotes.push(`${label} (파일 내용을 읽지 못했어요 - 손상되었거나 암호로 보호된 파일일 수 있어요)`);
        continue;
      }
      parts.push({ text: `--- 첨부파일 "${label}" 내용 ---\n${text}` });
      includedNames.push(label);
      continue;
    }

    // 2) 그 외 파일(문서류)은 Gemini가 이해하는 형식인지 확인한다. 이미지 메시지는 항상 시도.
    if (m.type === 'file' && !SUPPORTED_FILE_EXTENSIONS.has(extension)) {
      skippedNotes.push(
        `${label} (지원하지 않는 파일 형식이에요 - 이미지·PDF·텍스트·워드·엑셀 파일만 분석할 수 있어요)`,
      );
      continue;
    }

    const inline = await fetchAsInlinePart(m.fileUrl!);
    if (!inline) {
      skippedNotes.push(`${label} (파일을 가져오지 못했어요 - 파일 서버 접근 권한 문제일 수 있어요)`);
      continue;
    }
    parts.push({ inline_data: inline });
    includedNames.push(label);
  }

  if (candidates.length > MAX_ATTACHMENTS) {
    skippedNotes.push(`외 ${candidates.length - MAX_ATTACHMENTS}개 첨부파일 (첨부 개수 제한으로 생략)`);
  }

  return { parts, includedNames, skippedNotes };
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
export async function callGeminiForMinutes(
  transcript: string,
  _title: string,
  attachmentParts: GeminiPart[] = [],
): Promise<TiptapDoc> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API 키가 설정되지 않았어요. .env 파일의 VITE_GEMINI_API_KEY를 확인해주세요.');
  }
  if (!transcript.trim()) {
    throw new Error('요약할 대화 내용이 없어요.');
  }

  const promptText =
    attachmentParts.length > 0
      ? `${SYSTEM_INSTRUCTION}\n\n이 대화에는 ${attachmentParts.length}개의 이미지/파일이 첨부되어 함께 제공됩니다. 첨부 내용도 실제로 읽고 분석해서 요약에 반영하세요.\n\n대화 내용:\n${transcript}`
      : `${SYSTEM_INSTRUCTION}\n\n대화 내용:\n${transcript}`;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }, ...attachmentParts],
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
