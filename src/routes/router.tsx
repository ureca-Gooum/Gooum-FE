// src/routes/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { MainLayout } from "@/layouts/MainLayout";
import { ChatPage } from "@/pages/ChatPage";
import { KakaoCallback } from "@/pages/KakaoCallback";
import { DocsPage } from "@/pages/DocsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  // 카카오에서 돌려보내는 콜백 주소와 컴포넌트를 연결
  {
    path: "/auth/kakao/callback",
    element: <KakaoCallback />,
  },
  {
    path: "/app",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <ChatPage />,
      },
      {
        path: "docs", // /app/docs 경로로 접근 시 동시편집 화면
        element: <DocsPage />,
      },
    ],
  },
  // 별표(*) 라우터는 위에서 일치하는 주소가 없을 때만 실행되므로 항상 맨 마지막에 두어야 합니다.
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
