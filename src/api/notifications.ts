import api from "./axiosInstance";
import type { NotificationItem } from "@/types/notification";

export interface ApiNotification {
    notificationId: string;
    type: "message" | "mention" | "document" | "system";
    title: string;
    body: string;
    roomId: string;
    messageId: string;
    isRead: boolean;
    createdAt: string;
}

export interface GetNotificationsResponse {
    notifications: ApiNotification[];
    unreadCount: number;
    hasMore: boolean;
    nextCursor: string | null;
}

export const fetchNotifications = async (limit = 20, cursor?: string): Promise<{ data: NotificationItem[], hasMore: boolean, nextCursor: string | null, unreadCount: number }> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) {
        params.append('cursor', cursor);
    }
    const response = await api.get<GetNotificationsResponse>(`/api/notifications?${params.toString()}`);
    
    // Map ApiNotification to NotificationItem safely
    const rawNotifications = response.data?.notifications || [];
    const mappedData: NotificationItem[] = rawNotifications.map(n => ({
        id: n.notificationId,
        type: n.type,
        title: n.title,
        content: n.body,
        time: new Date(n.createdAt).toLocaleDateString(), // or formatting logic
        isRead: n.isRead,
        roomId: n.roomId,
        messageId: n.messageId,
    }));

    return {
        data: mappedData,
        hasMore: response.data?.hasMore ?? false,
        nextCursor: response.data?.nextCursor ?? null,
        unreadCount: response.data?.unreadCount ?? 0
    };
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    await api.patch(`/api/notifications/${notificationId}`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    await api.patch(`/api/notifications/read-all`);
};
