import { useKakaoAuth } from "../hooks/useKakaoAuth";

export const LoginPage = () => {
  const { loginWithKakao } = useKakaoAuth();

  return (
    <div style={{ padding: "50px" }}>
      <button
        onClick={loginWithKakao}
        style={{
          padding: "10px 20px",
          backgroundColor: "#FEE500",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        카카오 로그인
      </button>
    </div>
  );
};
