// src/routes/router.ts
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { MainLayout } from "@/layouts/MainLayout";
import { ChatPage } from "@/pages/ChatPage";
import { DocsPage } from "@/pages/DocsPage"; // 1. 방금 만든 페이지 import

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
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
        path: "docs", // 2. /app/docs 경로로 접근 시 동시편집 화면이 뜨도록 설정
        element: <DocsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
