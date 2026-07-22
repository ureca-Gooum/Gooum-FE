// @ts-ignore
import { useKakaoAuth } from "../hooks/useKakaoAuth";
import illustrationImage from "../assets/illustration.png";
import gooumLogo from "../assets/goounmLogo 2.png";
import avatarImage from "../assets/Avatar36.png";

export const LoginPage = () => {
  const { loginWithKakao } = useKakaoAuth();

  return (
    <div className="flex h-screen w-screen bg-[#F4F5F7] overflow-hidden text-gray-800 font-sans">

      {/* ── 좌측 사이드바 ── */}
      <aside className="flex w-[72px] flex-col items-center py-5 justify-between flex-shrink-0 z-20">
        <div className="flex flex-col items-center gap-8 w-full">

          {/* 상단 로고 */}
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img src={gooumLogo} alt="Gooum Logo" className="w-full h-full object-contain" />
          </div>

          {/* 메뉴 아이콘들 */}
          <nav className="flex flex-col w-full gap-4">
            <button className="group relative flex flex-col items-center gap-1.5 py-2 w-full text-[#3b82f6]">
              <div className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-[#3b82f6]"></div>
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-[10px] font-bold">활동</span>
            </button>

            <button className="flex flex-col items-center gap-1.5 py-2 w-full text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[10px] font-semibold">DM</span>
            </button>

            <button className="flex flex-col items-center gap-1.5 py-2 w-full text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-semibold">문서</span>
            </button>
          </nav>
        </div>

        {/* 하단 아바타 */}
        <div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
          <img src={avatarImage} alt="Avatar" className="w-9 h-9 object-cover rounded-full" />
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-[#F4F5F7]"></div>
        </div>
      </aside>

      {/* ── 우측 메인 영역 ── */}
      <main className="flex-1 my-2 mr-2 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col overflow-hidden relative z-10">

        {/* ── 상단바 ── */}
        <header className="flex items-center justify-between h-[52px] px-5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex justify-center max-w-[500px] mx-4">
            <div className="flex items-center w-full h-[32px] bg-[#F7F9FC] rounded-[8px] px-3 text-sm border border-gray-100">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-400 font-medium">검색</span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-gray-400">
            <button className="hover:text-gray-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <button className="hover:text-gray-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              </svg>
            </button>
            <button className="hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── 메인 콘텐츠 영역 ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-white relative overflow-y-auto">

          <div className="flex flex-col items-center text-center max-w-[600px] w-full mt-[-20px] sm:mt-[-40px]">

            {/* 중앙 일러스트 (투명 배경의 별도 에셋 사용) */}
            <div className="w-full max-w-[480px] mb-2 flex justify-center items-center">
              <img
                src={illustrationImage}
                alt="Illustration"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* 환영 문구 */}
            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#1f2937] mb-2 tracking-tight whitespace-nowrap">
              <span className="text-[#3b82f6]">구움</span>에 오신 것을 환영합니다!
            </h1>
            <p className="text-[13px] sm:text-[14.5px] text-gray-500 mb-8 font-medium whitespace-nowrap">
              좋은 아이디어는 함께 구울수록 더 맛있어집니다.
            </p>

            {/* 카카오 로그인 버튼 */}
            <button
              onClick={loginWithKakao}
              className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-bold px-12 sm:px-20 py-3 rounded-lg shadow-sm transition-colors active:scale-95 text-[14px] sm:text-[14.5px] whitespace-nowrap"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 2C4.029 2 0 4.887 0 8.448C0 10.741 1.584 12.756 4.025 13.916L3.064 17.51C2.981 17.818 3.32 18.041 3.593 17.868L7.814 15.178C8.196 15.228 8.591 15.257 9 15.257C13.971 15.257 18 12.37 18 8.81C18 5.25 13.971 2 9 2Z" fill="#191919" />
              </svg>
              카카오 로그인
            </button>

          </div>
        </div>

      </main>
    </div>
  );
};
