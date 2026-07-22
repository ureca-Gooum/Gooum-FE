import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// 요청 인터셉터 — 토큰 자동 첨부
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// 응답 인터셉터 — 401이면 토큰 재발급 시도
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // refreshToken으로 새 accessToken 발급
                const { data } = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true },
                );

                localStorage.setItem("accessToken", data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest); // 원래 요청 재시도
            } catch (refreshError) {
                // refreshToken도 만료 → 로그인 페이지로
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
