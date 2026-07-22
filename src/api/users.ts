import api from "@/api/axiosInstance";
import type { PresenceStatus } from "@/types/chat";

export interface UserApiResponse {
    userId: string;
    name: string;
    statusMessage: string | null;
    profileImageUrl: string | null;
    presence?: {
        status: PresenceStatus;
        lastSeenAt?: string | null;
    };
}

interface UserListApiResponse {
    users: UserApiResponse[];
    total: number;
}

export async function fetchUsers(): Promise<UserApiResponse[]> {
    const res = await api.get<UserListApiResponse>("/api/users");
    return res.data.users;
}

export const logout = async () => {
    const res = await api.post("/api/auth/logout");
    return res.data;
};
