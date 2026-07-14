// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'], // 추가
    alias: {
      '@': path.resolve('./src'), // 추가
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});

// '@' 별칭을 사용하면 'import Header from '@/organism/Header'처럼 사용 가능
// proxy 설정으로 '/api/~~' 요청이 http://localhost:3000/~~ 로 전달됨
