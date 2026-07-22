export const useKakaoAuth = () => {
    // process.env 대신 Vite 전용 문법인 import.meta.env를 사용합니다.
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_REST_API_KEY;
    const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    const loginWithKakao = () => {
        window.location.href = KAKAO_AUTH_URL;
    };

    return { loginWithKakao };
};
