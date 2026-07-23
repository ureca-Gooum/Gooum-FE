// src/routes/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { MainLayout } from "@/layouts/MainLayout";
import { ChatPage } from "@/pages/ChatPage";
import { KakaoCallback } from "@/pages/KakaoCallback";
import { DocsPage } from "@/pages/DocsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/login" replace />,
    },
    {
        path: "/auth/kakao/callback",
        element: <KakaoCallback />,
    },
    // 💡 MainLayout을 공통 레이아웃으로 적용
    {
        element: <MainLayout />,
        children: [
            {
                path: "login", // 접속 URL: /login
                element: <LoginPage />,
            },
            {
                path: "app", // 접속 URL: /app
                children: [
                    {
                        index: true,
                        element: <ChatPage />,
                    },
                    {
                        path: "docs", // 접속 URL: /app/docs
                        element: <DocsPage />,
                    },
                    {
                        path: "notifications", // 접속 URL: /app/notifications
                        element: <NotificationsPage />,
                    },
                ],
            },
        ],
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);
