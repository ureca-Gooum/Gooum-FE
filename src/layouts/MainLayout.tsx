// src/layouts/MainLayout.tsx
import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    // 사진이 화면 전체를 꽉 채울 수 있도록 전체 화면 크기만 잡아줍니다.
    <div className="h-screen w-screen overflow-hidden">
      <Outlet />
    </div>
  );
};
