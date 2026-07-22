import axios from '@/api/axiosInstance';
import type { MessageListApiResponse } from '@/types/message';

interface FetchMessagesParams {
  roomId: string;
  limit?: number;
  cursor?: string;
  search?: string;
}

export async function fetchMessages({
  roomId,
  limit = 50,
  cursor,
  search,
}: FetchMessagesParams): Promise<MessageListApiResponse> {
  try {
    const res = await axios.get<MessageListApiResponse>(`/api/rooms/${roomId}/messages`, {
      params: { limit, cursor, search },
    });
    return res.data;
  } catch (err: any) {
    const message = err.response?.data?.message ?? '메시지를 불러오지 못했어요.';
    throw new Error(message);
  }
}
