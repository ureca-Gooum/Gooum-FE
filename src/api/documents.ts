import axiosInstance from './axiosInstance';
import type { Document, GetDocumentsResponse, CreateDocumentRequest, SaveDocumentRequest } from '../types/document';

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
import { buildTranscript, callGeminiForMinutes } from '../utils/aiSummary';

export const createAiSummaryClientOnly = async (params: {
  roomId: string;
  title: string;
  messages: Message[];
}): Promise<Document> => {
  const transcript = buildTranscript(params.messages);
  const content = await callGeminiForMinutes(transcript, params.title);

  // 1) 빈 문서를 하나 만들고 (기존 "새 문서 추가" 버튼과 동일한 API)
  const newDoc = await createDocument({ title: params.title, roomId: params.roomId, type: "ai_summary" });
  // 2) AI가 만든 콘텐츠를 그 문서에 저장한다 (기존 자동저장과 동일한 API)
  await saveDocument(newDoc.documentId, { title: params.title, content });

  return { ...newDoc, content };
};
