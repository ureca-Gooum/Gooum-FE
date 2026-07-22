import axiosInstance from "./axiosInstance";
import type {
  Document,
  GetDocumentsResponse,
  CreateDocumentRequest,
  SaveDocumentRequest,
} from "../types/document";

// 문서 목록 조회
export const getDocuments = async (roomId?: string): Promise<GetDocumentsResponse> => {
  const params = roomId ? { roomId } : {};
  const response = await axiosInstance.get<GetDocumentsResponse>("/api/documents", { params });
  return response.data;
};

// 문서 상세 조회
export const getDocumentById = async (documentId: string): Promise<Document> => {
  const response = await axiosInstance.get<Document>(`/api/documents/${documentId}`);
  return response.data;
};

// 문서 생성
export const createDocument = async (data: CreateDocumentRequest): Promise<Document> => {
  const response = await axiosInstance.post<Document>("/api/documents", data);
  return response.data;
};

// 문서 저장 (자동 저장)
export const saveDocument = async (
  documentId: string,
  data: SaveDocumentRequest
): Promise<{ documentId: string; title: string; updatedAt: string }> => {
  const response = await axiosInstance.patch(`/api/documents/${documentId}`, data);
  return response.data;
};

// 문서 삭제
export const deleteDocument = async (documentId: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/api/documents/${documentId}`);
  return response.data;
};
