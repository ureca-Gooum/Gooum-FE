import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import illustrationImage from '@/assets/login.png';
import mascotIcon from '/favicon.png';

export const LoginPage = () => {
  const { loginWithKakao } = useKakaoAuth();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f2eefe] to-[#eaf4ff] @3xl:flex-row">
      {/* 왼쪽: 로고 + 문구 + 로그인 버튼 */}
      <div className="relative z-10 flex w-full flex-col justify-center overflow-y-auto px-6 py-10 @sm:px-10 @lg:px-16 @3xl:w-[46%] @3xl:px-20">
        <img src={mascotIcon} alt="구움" className="mb-6 h-12 w-12 @lg:mb-8 @lg:h-14 @lg:w-14" />

        <h1 className="mb-3 text-[26px] font-bold leading-tight tracking-tight text-[#1f2937] @lg:mb-4 @lg:text-[32px] @3xl:text-[38px]">
          매일 갓 구운
          <br />
          <span className="text-[#3b82f6]">이야기</span>가 있는 곳
        </h1>
        <p className="mb-8 max-w-[360px] text-[13.5px] font-medium leading-relaxed text-gray-500 @lg:mb-10 @lg:text-[14.5px]">
          좋은 아이디어는 함께 구울수록 더 맛있어집니다.
          <br />
          카카오 계정으로 바로 시작해보세요.
        </p>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={loginWithKakao}
          className="flex w-full max-w-[320px] items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-6 py-3 text-[14px] font-bold text-[#191919] shadow-sm transition-colors active:scale-95 hover:bg-[#FDD800] cursor-pointer @lg:py-3.5 @lg:text-[14.5px]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      <div className="relative hidden flex-1 items-center justify-center @3xl:flex">
        {/* 여러 겹의 은은한 브랜드 컬러 글로우로 입체감을 더함 */}
        <div className="absolute -right-20 top-[15%] h-[420px] w-[420px] rounded-full bg-[#c7d9ff] opacity-50 blur-3xl" />
        <div className="absolute left-[8%] bottom-[10%] h-[320px] w-[320px] rounded-full bg-[#e3d6ff] opacity-40 blur-3xl" />
        <div className="absolute right-[18%] top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-white/50 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center">
          <img
            src={illustrationImage}
            alt="구움 마스코트 일러스트"
            className="w-full max-w-[440px] object-contain drop-shadow-[0_30px_40px_rgba(76,143,225,0.25)] @5xl:max-w-[580px] @7xl:max-w-[720px]"
          />
        </div>
      </div>
    </div>
  );
};
