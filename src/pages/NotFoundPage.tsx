import { useNavigate } from 'react-router-dom';
import notFoundImage from '@/assets/404.png';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    // 로컬에 저장된 토큰을 지우고 처음(로그인)으로 되돌린다.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f2eefe] to-[#eaf4ff] px-6 text-center">
      {/* 일러스트 뒤에 깔리는 큰 404 장식 텍스트. 살짝 기울이고 위치를 어긋나게 둬서 불규칙한 느낌을 준다. */}
      <div className="relative mb-2 flex items-center justify-center">
        <span
          className="pointer-events-none absolute select-none font-black leading-none tracking-tighter text-[#c7d9ff]/70"
          style={{
            fontSize: 'clamp(140px, 28vw, 260px)',
            transform: 'rotate(-6deg) translate(2%, 6%)',
            zIndex: 0,
          }}>
          404
        </span>
        <img
          src={notFoundImage}
          alt="404"
          className="relative z-10 w-full max-w-[280px] object-contain drop-shadow-[0_20px_30px_rgba(76,143,225,0.2)] sm:max-w-[360px]"
        />
      </div>

      <h1 className="mb-3 text-[24px] font-bold tracking-tight text-[#1f2937] sm:text-[28px]">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mb-8 max-w-[360px] text-[13.5px] font-medium leading-relaxed text-gray-500 sm:text-[14.5px]">
        요청하신 페이지가 삭제되었거나
        <br />
        주소가 변경되었을 수 있어요.
      </p>

      <div className="flex items-center gap-4 text-[14px] font-semibold">
        <button onClick={handleGoHome} className="text-[#3b82f6] transition-colors hover:text-[#2563eb] cursor-pointer">
          홈으로 돌아가기
        </button>
        <span className="text-gray-300">|</span>
        <button onClick={handleLogout} className="text-gray-400 transition-colors hover:text-gray-600 cursor-pointer">
          로그아웃
        </button>
      </div>
    </div>
  );
};
