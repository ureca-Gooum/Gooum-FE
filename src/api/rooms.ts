import axios from '@/api/axiosInstance';
import type { RoomApiResponse, RoomType } from '@/types/room';

interface CreateRoomPayload {
  type: RoomType;
  name?: string; // group일 때만
  memberIds: string[];
}

export async function createRoom(payload: CreateRoomPayload): Promise<RoomApiResponse> {
  try {
    const res = await axios.post<RoomApiResponse>('/api/rooms', payload);
    return res.data;
  } catch (err: any) {
    const message = err.response?.data?.message ?? '채팅방을 생성하지 못했어요.';
    throw new Error(message);
  }
}
