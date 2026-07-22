// src/components/layout/Sidebar.tsx
import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, FileText, Settings, Coffee, LogOut } from 'lucide-react';
import avatarImage from '@/assets/Avatar36.png';

const navItems = [
  { icon: Bell, label: '알림', to: '/app/notifications' },
  { icon: MessageCircle, label: 'DM', to: '/app' },
  { icon: FileText, label: '문서', to: '/app/docs' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 현재 상태 관리
  const [status, setStatus] = useState<'온라인' | '자리비움' | '방해금지' | '휴가'>('온라인');

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (s: string) => {
    switch (s) {
      case '온라인':
        return 'bg-green-500';
      case '자리비움':
        return 'bg-yellow-500';
      case '방해금지':
        return 'bg-red-500';
      case '휴가':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center justify-between pb-4 bg-bg-canvas relative h-full">
      {/* 상단 네비게이션 아이템들 */}
      <div className="flex w-full flex-col items-center gap-4">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/app'} // DM 탭이 /app/docs에 활성화되지 않도록 end 속성 추가
            className={({ isActive }) =>
              `flex w-full flex-col items-center gap-1 rounded-lg py-2 transition-colors ${
                isActive
                  ? 'text-brand-primary bg-bg-subtle'
                  : 'text-fg-tertiary hover:bg-bg-subtle hover:text-brand-primary'
              }`
            }>
            <Icon size={20} />
            <span className="text-[11px]">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* 하단 아바타 및 상태 변경 팝업 메뉴 */}
      <div className="relative mt-auto" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 focus:outline-none">
          <img
            src={avatarImage}
            alt="Profile Avatar"
            className="w-9 h-9 object-cover rounded-full shadow-sm hover:ring-2 hover:ring-gray-200"
          />
          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(status)} ring-2 ring-bg-canvas`}></div>
        </button>

        {/* 팝업 메뉴 */}
        {isMenuOpen && (
          <div className="absolute bottom-12 left-12 w-48 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-gray-100 p-2 z-50 overflow-hidden transform origin-bottom-left transition-all">
            <div className="px-3 py-2 border-b border-gray-50 mb-1">
              <p className="text-[13px] font-bold text-gray-800">박소연</p>
              <p className="text-[11px] text-gray-400 mt-0.5">내 상태 설정</p>
            </div>

            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setStatus('온라인');
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 rounded-md text-[12px] text-gray-600 transition-colors w-full text-left font-medium">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> 온라인
              </button>
              <button
                onClick={() => {
                  setStatus('자리비움');
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 rounded-md text-[12px] text-gray-600 transition-colors w-full text-left font-medium">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div> 자리비움
              </button>
              <button
                onClick={() => {
                  setStatus('방해금지');
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 rounded-md text-[12px] text-gray-600 transition-colors w-full text-left font-medium">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> 방해금지
              </button>
              <button
                onClick={() => {
                  setStatus('휴가');
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-purple-50 rounded-md text-[12px] text-gray-600 transition-colors w-full text-left font-medium">
                <Coffee size={12} className="text-purple-500" /> 휴가중
              </button>
            </div>

            <div className="h-px bg-gray-100 my-1"></div>

            <button className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 rounded-md w-full text-left text-[12px] text-gray-600 transition-colors font-medium">
              <Settings size={14} className="text-gray-400" /> 환경설정
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-red-500 rounded-md w-full text-left text-[12px] transition-colors mt-0.5 font-medium">
              <LogOut size={14} /> 로그아웃
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
