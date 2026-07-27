import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, FileText, Palette, MoreHorizontal } from 'lucide-react';
import { ProfileButton } from './ProfileButton';
import { useUnreadBadge } from '@/hooks/useUnreadBadge';
import { ConfirmModal } from '@/components/ConfirmModal';

const navItems = [
  { icon: Bell, label: '알림', to: '/app/notifications' },
  { icon: MessageCircle, label: 'DM', to: '/app' },
  { icon: FileText, label: '문서', to: '/app/docs' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [isLoginAlertOpen, setIsLoginAlertOpen] = useState(false);

  const { unreadNotiCount, unreadDMCount } = useUnreadBadge();

  // 테마 상태 관리 (develop 브랜치에서 추가된 기능 - 그대로 유지)
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('gooum-theme') || 'light';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const mobileThemeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('gooum-theme', theme);
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) &&
        (!mobileThemeMenuRef.current || !mobileThemeMenuRef.current.contains(event.target as Node))
      ) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className="flex w-full @md:w-16 shrink-0 flex-row @md:flex-col items-center justify-around @md:justify-between px-2 @md:px-0 pb-0 @md:pb-4 bg-white/70 @md:bg-bg-canvas backdrop-blur-xl @md:backdrop-blur-none relative h-[60px] @md:h-full border-t border-border-default/40 @md:border-border-default @md:border-t-0 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] @md:shadow-none z-50">

      {/* '채팅' 헤더 텍스트와 높이를 맞추기 위한 여백. 숫자만 조절하면 위/아래로 미세조정 가능. */}
      <div className="flex flex-1 @md:flex-none w-full flex-row @md:flex-col items-center justify-around @md:justify-start gap-1 @md:gap-4 pt-0 @md:pt-4">
        {navItems.map(({ icon: Icon, label, to }) => {
          const unreadCount = label === '알림' ? unreadNotiCount : label === 'DM' ? unreadDMCount : 0;
          return (
            <NavLink
              key={label}
              to={to}
              end={to === '/app'}
              onClick={(e) => {
                if (!localStorage.getItem('accessToken')) {
                  e.preventDefault();
                  setIsLoginAlertOpen(true);
                }
              }}
              className={({ isActive }) =>
                `flex w-[60px] @md:w-full flex-col items-center gap-1 rounded-lg py-2 transition-colors ${
                  isActive
                    ? 'text-brand-primary bg-bg-subtle'
                    : 'text-fg-tertiary hover:bg-bg-subtle hover:text-brand-primary'
                }`
              }>
              <div className="relative">
                <Icon size={20} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1.5 -right-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white shadow-sm ring-1 ring-bg-canvas leading-none tracking-tighter">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <span className="text-[11px]">{label}</span>
            </NavLink>
          );
        })}

        {/* 모바일용 더보기(테마) 메뉴 */}
        <div className="relative flex @md:hidden flex-col items-center justify-center w-[60px]" ref={mobileThemeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`flex w-full flex-col items-center gap-1 py-2 rounded-lg transition-colors focus:outline-none ${
              isThemeMenuOpen
                ? 'bg-bg-subtle text-brand-primary'
                : 'text-fg-tertiary hover:bg-bg-subtle hover:text-brand-primary'
            }`}
            title="더보기">
            <MoreHorizontal size={20} />
            <span className="text-[11px]">더보기</span>
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 @md:right-auto @md:left-14 bottom-14 @md:bottom-0 w-32 rounded-xl border border-border-default bg-bg-default p-2 shadow-lg z-50">
              <div className="mb-2 px-2 text-xs font-semibold text-fg-secondary">테마 선택</div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'light', label: 'light', color: '#ffffff' },
                  { id: 'dark', label: 'dark', color: '#1f2229' },
                  { id: 'pastel-brown', label: 'brown', color: '#fdf8f5' },
                  { id: 'pastel-pink', label: 'pink', color: '#fff0f5' },
                  { id: 'pastel-green', label: 'green', color: '#f0fff0' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
                      theme === t.id
                        ? 'bg-bg-subtle text-brand-primary font-medium'
                        : 'text-fg-primary hover:bg-bg-subtle'
                    }`}>
                    <div
                      className="h-3.5 w-3.5 rounded-full border border-border-default shadow-sm"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-auto mb-4 hidden @md:flex flex-col items-center" ref={themeMenuRef}>
        <button
          onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none ${
            isThemeMenuOpen
              ? 'bg-bg-subtle text-brand-primary'
              : 'text-fg-tertiary hover:bg-bg-subtle hover:text-brand-primary'
          }`}
          title="테마 변경">
          <Palette size={20} />
        </button>

        {isThemeMenuOpen && (
          <div className="absolute right-0 @md:right-auto @md:left-14 bottom-12 @md:bottom-0 w-32 rounded-xl border border-border-default bg-bg-default p-2 shadow-lg z-50">
            <div className="mb-2 px-2 text-xs font-semibold text-fg-secondary">테마 선택</div>
            <div className="flex flex-col gap-1">
              {[
                { id: 'light', label: 'light', color: '#ffffff' },
                { id: 'dark', label: 'dark', color: '#1f2229' },
                { id: 'pastel-brown', label: 'brown', color: '#fdf8f5' },
                { id: 'pastel-pink', label: 'pink', color: '#fff0f5' },
                { id: 'pastel-green', label: 'green', color: '#f0fff0' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
                    theme === t.id
                      ? 'bg-bg-subtle text-brand-primary font-medium'
                      : 'text-fg-primary hover:bg-bg-subtle'
                  }`}>
                  <div
                    className="h-3.5 w-3.5 rounded-full border border-border-default shadow-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ProfileButton className="hidden @md:flex" dropdownClassName="absolute right-0 @md:right-auto @md:left-14 bottom-14 @md:bottom-0" />

      <ConfirmModal
        isOpen={isLoginAlertOpen}
        title="로그인이 필요합니다"
        message="해당 기능을 사용하시려면 먼저 로그인을 진행해주세요."
        confirmText="로그인 화면으로"
        cancelText="닫기"
        onConfirm={() => {
          setIsLoginAlertOpen(false);
          navigate('/login');
        }}
        onCancel={() => setIsLoginAlertOpen(false)}
      />
    </aside>
  );
}
