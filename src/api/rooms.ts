import axios from '@/api/axiosInstance';
import type { RoomApiResponse, RoomListApiResponse, RoomType } from '@/types/room';

interface CreateRoomPayload {
  type: RoomType;
  name?: string;
  memberIds: string[];
}

function handleApiError(err: any, fallbackMessage: string): never {
  const message = err.response?.data?.message ?? fallbackMessage;
  throw new Error(message);
}

export async function fetchRooms(): Promise<RoomListApiResponse> {
  try {
    const res = await axios.get<RoomListApiResponse>('/api/rooms');
    return res.data;
  } catch (err: any) {
    handleApiError(err, '채팅방 목록을 불러오지 못했어요.');
  }
}

export async function fetchRoomDetail(roomId: string): Promise<RoomApiResponse> {
  try {
    const res = await axios.get<RoomApiResponse>(`/api/rooms/${roomId}`);
    return res.data;
  } catch (err: any) {
    handleApiError(err, '채팅방 정보를 불러오지 못했어요.');
  }
}

export async function createRoom(payload: CreateRoomPayload): Promise<RoomApiResponse> {
  try {
    const res = await axios.post<RoomApiResponse>('/api/rooms', payload);
    return res.data;
  } catch (err: any) {
    handleApiError(err, '채팅방을 생성하지 못했어요.');
  }
}

export async function leaveRoom(roomId: string): Promise<{ message: string }> {
  try {
    const res = await axios.delete(`/api/rooms/${roomId}`);
    return res.data;
  } catch (err: any) {
    handleApiError(err, '채팅방을 나가지 못했어요.');
  }
}

export async function toggleFavorite(roomId: string, isFavorite: boolean): Promise<RoomApiResponse> {
  try {
    const res = await axios.patch<RoomApiResponse>(`/api/rooms/${roomId}/favorite`, {
      isFavorite,
    });
    return res.data;
  } catch (err: any) {
    handleApiError(err, '즐겨찾기 변경에 실패했어요.');
  }
}

export async function inviteRoomMembers(
  roomId: string,
  memberIds: string[]
): Promise<{ message: string; addedCount: number }> {
  try {
    const res = await axios.post(`/api/rooms/${roomId}/members`, { memberIds });
    return res.data;
  } catch (err: any) {
    handleApiError(err, '멤버를 초대하지 못했어요.');
  }
}

export async function updateRoomNotificationSettings(
  roomId: string,
  settings: { message: boolean; mention: boolean }
): Promise<{ roomId: string; notificationSettings: { message: boolean; mention: boolean } }> {
  try {
    const res = await axios.patch(`/api/rooms/${roomId}/notifications`, settings);
    return res.data;
  } catch (err: any) {
    handleApiError(err, '채팅방 알림 설정에 실패했어요.');
  }
}

export async function updateRoomName(roomId: string, name: string): Promise<RoomApiResponse> {
  try {
    const res = await axios.patch<RoomApiResponse>(`/api/rooms/${roomId}`, { name });
    return res.data;
  } catch (err: any) {
    handleApiError(err, '채팅방 이름을 변경하지 못했어요.');
  }
}
