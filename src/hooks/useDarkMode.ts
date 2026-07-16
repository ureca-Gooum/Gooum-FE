import { useState, useEffect } from "react";

export const useDarkMode = () => {
  // 1. 초기 상태 세팅: 이전에 저장된 테마가 있는지, 아니면 사용자 컴퓨터(OS)가 다크모드인지 확인
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    // 저장된 게 없다면 컴퓨터 OS 기본 설정을 따라감
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // 2. isDarkMode 상태가 바뀔 때마다 HTML 태그에 'dark' 클래스를 넣거나 빼줌
  useEffect(() => {
    const root = window.document.documentElement; // <html> 태그를 의미함

    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  //  스위치 토글
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return { isDarkMode, toggleDarkMode };
};

/* 다크모드 스위치 */
// import { useDarkMode } from '@/hooks/useDarkMode';

// export const SettingPage = () => {
//   const { isDarkMode, toggleDarkMode } = useDarkMode();

//   return (
//     // Tailwind의 'dark:~~' 클래스가 다크모드일 때 적용될 디자인입니다.
//     // 지금은 임시로 흰색/검은색만 넣어둡니다.
//     <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">

//       <div className="p-10">
//         <h1 className="text-2xl font-bold mb-5">설정 페이지</h1>

//         <button
//           onClick={toggleDarkMode}
//           className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 font-bold"
//         >
//           {isDarkMode ? '🌞 라이트 모드로 전환' : '🌙 다크 모드로 전환'}
//         </button>

//         <p className="mt-5">
//           버튼을 누르면 html 태그에 dark 클래스가 생기고 배경이 까맣게 변합니다!
//         </p>
//       </div>

//     </div>
//   );
// };
