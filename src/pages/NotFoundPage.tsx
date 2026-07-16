import { useNavigate } from "react-router-dom";

export const NotFoundPage = () => {
  // react-router-dom의 useNavigate 훅을 사용해 페이지를 이동시킵니다.
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. 로컬 스토리지에 저장된 토큰(출입증)을 삭제합니다.
    // (아직 백엔드와 연결해 토큰을 저장하진 않았지만, 미리 로직을 짜둡니다)
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // 2. 다시 메인(또는 로그인) 페이지로 이동시킵니다.
    // 프로젝트 라우터 설정에 따라 "/login" 이나 "/" 로 변경하시면 됩니다.
    navigate("/");
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>페이지를 찾을 수 없습니다 (404)</h2>
      <p>
        카카오 인증은 성공했지만, 인가 코드를 처리할 Callback 페이지가 아직
        없습니다!
      </p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#ff4d4f", // 경고/로그아웃 느낌의 빨간색
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        로그아웃 (토큰 삭제 후 처음으로)
      </button>
    </div>
  );
};
