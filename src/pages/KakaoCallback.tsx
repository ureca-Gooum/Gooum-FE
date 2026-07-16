import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // 1. axios를 불러옵니다.

export const KakaoCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. 현재 브라우저 주소창의 URL에서 'code' 값만 쏙 뽑아냅니다.
    const code = new URL(window.location.href).searchParams.get("code");

    if (code) {
      console.log("카카오에서 받은 인가 코드:", code);
      sendCodeToBackend(code); // 2. 아래에 만든 통신 함수를 실행합니다.
    } else {
      console.error("인가 코드가 없습니다.");
      navigate("/login");
    }
  }, [navigate]);

  // 3. 백엔드로 코드를 쏴주고 토큰을 받아오는 핵심 함수!
  const sendCodeToBackend = async (code: string) => {
    try {
      // 스웨거에서 확인한 주소(/api/auth/login)와 POST 방식 적용!
      const response = await axios.post("/api/auth/login", {
        code: code, // 백엔드가 다른 이름(예: authorizationCode)을 원하면 이 부분을 수정해야 합니다.
      });

      console.log("백엔드 응답 데이터:", response.data);

      // 4. 백엔드가 준 토큰을 창고(localStorage)에 보관합니다.
      // (주의: 백엔드가 토큰 이름을 accessToken이 아니라 다르게 준다면 수정 필요!)
      const accessToken = response.data.accessToken;

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        navigate("/app"); // 토큰 저장 완료 = 로그인 성공! 메인 화면으로 이동합니다.
      } else {
        console.warn("토큰이 없습니다. 백엔드 응답을 확인해주세요.");
      }
    } catch (error) {
      console.error("백엔드 로그인 연동 실패:", error);
      alert("로그인에 실패했습니다. 다시 시도해 주세요.");
      navigate("/login");
    }
  };

  return (
    // 프로젝트에 설치된 Tailwind CSS를 써서 화면 정중앙에 배치했습니다.
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">
        카카오 로그인 처리 중입니다... 🔄
      </h2>
      <p className="text-gray-500">잠시만 기다려 주세요.</p>
    </div>
  );
};
