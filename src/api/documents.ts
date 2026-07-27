import axiosInstance from './axiosInstance';
import type { Document, GetDocumentsResponse, CreateDocumentRequest, SaveDocumentRequest } from '@/types/document';

// 문서 목록 조회
export const getDocuments = async (roomId?: string): Promise<GetDocumentsResponse> => {
  const params = roomId ? { roomId } : {};
  const response = await axiosInstance.get<GetDocumentsResponse>('/api/documents', { params });
  return response.data;
};

// 문서 상세 조회
export const getDocumentById = async (documentId: string): Promise<Document> => {
  const response = await axiosInstance.get<Document>(`/api/documents/${documentId}`);
  return response.data;
};

// 문서 생성
export const createDocument = async (data: CreateDocumentRequest): Promise<Document> => {
  const response = await axiosInstance.post<Document>('/api/documents', data);
  return response.data;
};

// 문서 저장 (자동 저장)
export const saveDocument = async (
  documentId: string,
  data: SaveDocumentRequest,
): Promise<{ documentId: string; title: string; updatedAt: string }> => {
  const response = await axiosInstance.patch(`/api/documents/${documentId}`, data);
  return response.data;
};

// 문서 삭제
export const deleteDocument = async (documentId: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/api/documents/${documentId}`);
  return response.data;
};

import type { Message } from '../types/chat';
import {
  buildTranscript,
  callGeminiForMinutes,
  collectAttachmentParts,
  buildPreviousMinutesRefs,
} from '../utils/aiSummary';
import { extractPreviewText } from '../utils/tiptap';

function extractServerErrorMessage(err: any): string | null {
  const data = err?.response?.data;
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.errors)) {
    return data.errors.map((e: any) => (typeof e === 'string' ? e : (e?.message ?? JSON.stringify(e)))).join(', ');
  }
  if (data.errors && typeof data.errors === 'object') {
    return Object.values(data.errors)
      .map((e: any) => (typeof e === 'string' ? e : (e?.message ?? JSON.stringify(e))))
      .join(', ');
  }
  return null;
}

export const createAiSummaryClientOnly = async (params: {
  roomId: string;
  title: string;
  messages: Message[];
  customPrompt?: string;
}): Promise<Document & { skippedAttachmentNotes?: string[] }> => {
  const transcript = buildTranscript(params.messages);
  // 선택된 메시지 중 이미지/파일이 있으면 함께 읽어서 요약에 반영한다.
  const { parts, skippedNotes } = await collectAttachmentParts(params.messages);

  // 선택 범위에 이전 회의록 카드가 있으면, 그 문서의 (이미 압축된) 내용을 가져와서 참고자료로 넘긴다.
  // 원본 채팅을 다시 넣는 게 아니라 이미 요약된 결과물이라 비용이 크지 않다.
  const previousRefs = buildPreviousMinutesRefs(params.messages);
  const previousMinutesContext = (
    await Promise.all(
      previousRefs.map(async (ref) => {
        try {
          const doc = await getDocumentById(ref.documentId);
          const text = extractPreviewText(doc.content);
          return text ? { title: ref.title, content: text } : null;
        } catch {
          return null;
        }
      }),
    )
  ).filter((v): v is { title: string; content: string } => !!v);

  const { content, suggestedTitle } = await callGeminiForMinutes(
    transcript,
    params.title,
    parts,
    params.customPrompt,
    previousMinutesContext,
  );
  const finalTitle = params.title.trim() || suggestedTitle || '회의록';

  let newDoc: Document;
  try {
    // 1) 빈 문서를 하나 만들고 (기존 "새 문서 추가" 버튼과 동일한 API)
    newDoc = await createDocument({ title: finalTitle, roomId: params.roomId, type: 'ai_summary' });
  } catch (err: any) {
    console.error('[AI 회의록] 문서 생성(createDocument) 실패, 서버 응답:', err?.response?.status, err?.response?.data);
    throw new Error(`문서 생성 실패: ${extractServerErrorMessage(err) || err?.message || '알 수 없는 오류'}`);
  }

  try {
    // 2) AI가 만든 콘텐츠를 그 문서에 저장한다 (기존 자동저장과 동일한 API)
    await saveDocument(newDoc.documentId, { title: finalTitle, content });
  } catch (err: any) {
    console.error('[AI 회의록] 문서 저장(saveDocument) 실패, 서버 응답:', err?.response?.status, err?.response?.data);
    throw new Error(`문서 저장 실패: ${extractServerErrorMessage(err) || err?.message || '알 수 없는 오류'}`);
  }

  return {
    ...newDoc,
    title: finalTitle,
    content,
    skippedAttachmentNotes: skippedNotes.length > 0 ? skippedNotes : undefined,
  };
};
