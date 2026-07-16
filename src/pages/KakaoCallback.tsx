import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// 💡 만약 아까 만든 우체부(Interceptor)를 적용하시려면 아래 줄을 'import api from "../api/axios";' 로 바꾸고,
// 코드 안의 axios.post를 api.post("/api/auth/login", ...)
import axios from "axios";

export const KakaoCallback = () => {
  const navigate = useNavigate();
  // 한 번 보냈는지 기억하는 깃발 생성
  const hasFetched = useRef(false);

  //  1. 함수 덩어리를 useEffect '위로'
  const sendCodeToBackend = async (code: string) => {
    try {
      // 스웨거에서 확인한 주소(/api/auth/login)와 POST 방식 적용!
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        {
          code: code, // 백엔드가 다른 이름(예: authorizationCode)을 원하면 이 부분을 수정
        },
      );

      console.log("백엔드 응답 데이터:", response.data);

      // 백엔드가 준 토큰을 창고(localStorage)에 보관
      const accessToken = response.data.accessToken;

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        navigate("/app"); // 토큰 저장 완료 = 로그인 성공 메인 화면으로 이동
      } else {
        console.warn("토큰이 없습니다. 백엔드 응답을 확인해주세요.");
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
  }, [navigate]); // navigate 외에 sendCodeToBackend는 함수 내부 로직이므로 배열에 넣지 않아도 무방

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">
        카카오 로그인 처리 중입니다... 🔄
      </h2>
      <p className="text-gray-500">잠시만 기다려 주세요.</p>
    </div>
  );
};
