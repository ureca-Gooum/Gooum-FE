import axios from '@/api/axiosInstance';
import type { SearchApiResponse } from '@/types/search';

export async function fetchSearch(
  q: string,
  roomId?: string,
  limit?: number
): Promise<SearchApiResponse> {
  try {
    const params: Record<string, any> = { q };
    if (roomId) params.roomId = roomId;
    if (limit) params.limit = limit;

    const res = await axios.get<SearchApiResponse>('/api/search', { params });
    return res.data;
  } catch (err: any) {
    const message = err.response?.data?.message ?? '검색 결과를 불러오지 못했어요.';
    throw new Error(message);
  }
}
