// src/pages/LoginPage.tsx
// @ts-ignore
import { useKakaoAuth } from "../hooks/useKakaoAuth";
import illustrationImage from "../assets/illustration.png";

export const LoginPage = () => {
    const { loginWithKakao } = useKakaoAuth();

    return (
        <div className="flex-1 rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center relative overflow-y-auto sm:p-8">
            <div className="flex max-w-[600px] w-full flex-col items-center text-center mt-[-20px] sm:mt-[-40px]">
                {/* 중앙 일러스트 */}
                <div className="mb-2 flex w-full max-w-[480px] items-center justify-center">
                    <img
                        src={illustrationImage}
                        alt="Illustration"
                        className="h-auto w-full object-contain"
                    />
                </div>

                {/* 환영 문구 */}
                <h1 className="mb-2 text-[22px] font-bold text-[#1f2937] tracking-tight whitespace-nowrap sm:text-[26px]">
                    <span className="text-[#3b82f6]">구움</span>에 오신 것을
                    환영합니다!
                </h1>
                <p className="mb-8 text-[13px] font-medium text-gray-500 whitespace-nowrap sm:text-[14.5px]">
                    좋은 아이디어는 함께 구울수록 더 맛있어집니다.
                </p>

                {/* 카카오 로그인 버튼 */}
                <button
                    onClick={loginWithKakao}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-12 py-3 text-[14px] font-bold text-[#191919] shadow-sm transition-colors active:scale-95 hover:bg-[#FDD800] whitespace-nowrap sm:px-20 sm:text-[14.5px] cursor-pointer"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9 2C4.029 2 0 4.887 0 8.448C0 10.741 1.584 12.756 4.025 13.916L3.064 17.51C2.981 17.818 3.32 18.041 3.593 17.868L7.814 15.178C8.196 15.228 8.591 15.257 9 15.257C13.971 15.257 18 12.37 18 8.81C18 5.25 13.971 2 9 2Z"
                            fill="#191919"
                        />
                    </svg>
                    카카오 로그인
                </button>
            </div>
        </div>
    );
};
