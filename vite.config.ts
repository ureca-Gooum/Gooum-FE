import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // @ 경로 설정만 남기고 리액트 강제 고정 부분은 삭제합니다.
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
