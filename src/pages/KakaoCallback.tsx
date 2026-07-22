import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";

export const KakaoCallback = () => {
    const navigate = useNavigate();
    // 한 번 보냈는지 기억하는 깃발 생성
    const hasFetched = useRef(false);

    const sendCodeToBackend = async (code: string) => {
        try {
            const response = await api.post("/api/auth/login", { code });

            const accessToken = response.data.accessToken;
            const userName = response.data.name;

            if (accessToken) {
                localStorage.setItem("accessToken", accessToken);

                // 사용자 이름도 함께 로컬 스토리지에 저장
                if (userName) {
                    localStorage.setItem("userName", userName);
                }

                navigate("/app");
            }
        } catch (error) {
            console.error("백엔드 로그인 연동 실패:", error);
            alert("로그인에 실패했습니다. 다시 시도해 주세요.");
            navigate("/login");
        }
    };

    useEffect(() => {
        const code = new URL(window.location.href).searchParams.get("code");

        // 코드가 있고, 아직 요청을 안 보냈을 때만 실행
        if (code && !hasFetched.current) {
            hasFetched.current = true; // 깃발을 꽂아서 다음 요청 차단
            console.log("카카오에서 받은 인가 코드:", code);
            sendCodeToBackend(code);
        } else if (!code) {
            navigate("/login");
        }
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <h2 className="text-2xl font-bold mb-4">
                카카오 로그인 처리 중입니다...
            </h2>
            <p className="text-gray-500">잠시만 기다려 주세요.</p>
        </div>
    );
};
