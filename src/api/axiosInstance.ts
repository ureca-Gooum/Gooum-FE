import axios from 'axios';

const api = axios.create({
  // 백엔드 기본 주소를 미리 적어둡니다 (.env에서 가져옴)
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 직전에 무조건 실행되는 코드 (Interceptor)
api.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 우리가 저장해둔 토큰을 꺼냄
    const token = localStorage.getItem('accessToken');

    // 토큰이 있다면, 헤더(Authorization)에 'Bearer 토큰값' 형태로 붙임
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;

// 요청 나가기 직전에 토큰을 자동으로 헤더에 끼워넣음
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
