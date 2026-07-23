import api from '@/api/axiosInstance';

export interface UploadFileResponse {
  fileUrl: string;
}

/**
 * 공용 파일 업로드 (Azure Blob Storage 등 서버가 저장하고 fileUrl을 내려줌).
 * 백엔드 명세: POST /api/upload, multipart/form-data, key는 "file".
 * (프로필 사진 업로드 - Sidebar.tsx - 와 동일한 엔드포인트/방식을 그대로 재사용)
 */
export async function uploadFile(file: File): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<UploadFileResponse>('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!res.data?.fileUrl) {
    throw new Error('파일 URL을 받아오지 못했습니다.');
  }

  return res.data;
}
