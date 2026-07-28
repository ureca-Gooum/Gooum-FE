import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, FileText, Palette } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { ProfileDropdown } from './ProfileDropdown';
import { USER_STATUS_CONFIG } from '@/types/user';
import { getCurrentUserId } from '@/constants/auth';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useUnreadBadge } from '@/hooks/useUnreadBadge';
import { disconnectSocket } from '@/socket/socket';
import { logout } from '@/api/users';
import { ConfirmModal } from '@/components/ConfirmModal';

const navItems = [
  { icon: Bell, label: '알림', to: '/app/notifications', tourId: 'nav-notifications' },
  { icon: MessageCircle, label: 'DM', to: '/app', tourId: 'nav-dm' },
  { icon: FileText, label: '문서', to: '/app/docs', tourId: 'nav-docs' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginAlertOpen, setIsLoginAlertOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { unreadNotiCount, unreadDMCount } = useUnreadBadge();

  const {
    userName,
    status,
    statusMessage,
    userImage,
    onStatusChange,
    onStatusMessageChange,
    uploadImage,
    resetLocalState,
  } = useMyProfile();

  // 테마 상태 관리 (develop 브랜치에서 추가된 기능 - 그대로 유지)
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('gooum-theme') || 'light';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('gooum-theme', theme);
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadImage(file);
  };

  const handleProfileClick = () => {
    const token = localStorage.getItem('accessToken');
    // 토큰이 없는 로그아웃 상태면 모달을 열지 않습니다.
    if (!token) {
      setIsMenuOpen(false);
      return;
    }
    setIsMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await logout(); // 백엔드 로그아웃 API 호출
    } catch (error) {
      // 이미 토큰이 만료되었거나 실패해도 사용자 측 로그아웃은 진행되어야 함
      console.warn('백엔드 로그아웃 처리 중 에러 발생 (이미 만료된 토큰 등):', error);
    } finally {
      // 1. 소켓 연결 종료 (로그아웃 시점에만 - 페이지 이동만으로는 끊지 않는다)
      disconnectSocket();

      // 2. 스토리지 정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('gooum_cached_documents');
      localStorage.removeItem('gooum_doc_files');

      // 3. 프로필 및 사용자 상태 초기화 (이미지 잔상 제거)
      resetLocalState();

      // 4. 로그인 페이지로 이동
      navigate('/login');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusColor = USER_STATUS_CONFIG[status]?.color || 'bg-fg-disabled';

  return (
    <aside className="flex w-full @md:w-16 shrink-0 flex-row @md:flex-col items-center justify-around @md:justify-between @md:pb-4 bg-bg-canvas relative h-full">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />

      {/* '채팅' 헤더 텍스트와 높이를 맞추기 위한 여백. 숫자만 조절하면 위/아래로 미세조정 가능. */}
      <div className="flex flex-1 @md:flex-none w-full flex-row @md:flex-col items-center justify-around @md:justify-start gap-0 @md:gap-4 pt-0 @md:pt-4 h-full @md:h-auto px-2 @md:px-0">
        {navItems.map(({ icon: Icon, label, to, tourId }) => {
          const unreadCount = label === '알림' ? unreadNotiCount : label === 'DM' ? unreadDMCount : 0;
          return (
            <NavLink
              key={label}
              to={to}
              end={to === '/app'}
              data-tour={tourId}
              onClick={(e) => {
                if (!localStorage.getItem('accessToken')) {
                  e.preventDefault();
                  setIsLoginAlertOpen(true);
                }
              }}
              className={({ isActive }) =>
                `group relative flex w-auto @md:w-full flex-col items-center gap-1 rounded-lg px-4 @md:px-0 py-1.5 @md:py-2 transition-colors ${
                  isActive
                    ? 'text-brand-primary @md:bg-bg-subtle'
                    : 'text-fg-tertiary hover:bg-bg-subtle hover:text-brand-primary'
                }`
              }>
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-primary transition-all duration-300 ease-out ${
                      isActive ? 'h-9 opacity-100' : 'h-0 opacity-0 group-hover:h-5 group-hover:opacity-100'
                    }`}
                  />
                  <div className="relative">
                    <Icon size={20} fill={isActive ? 'currentColor' : 'none'} />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1.5 -right-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white shadow-sm ring-1 ring-bg-canvas leading-none tracking-tighter">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px]">{label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="relative @md:mt-auto @md:mb-4 flex flex-col items-center hidden @md:flex" ref={themeMenuRef}>
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
          <div className="absolute left-14 bottom-0 w-40 rounded-xl border border-border-default bg-bg-default p-2 shadow-lg z-50">
            <div className="mb-2 px-2 text-xs font-semibold text-fg-secondary">테마 선택</div>
            <div className="flex flex-col gap-1">
              {[
                { id: 'light', label: 'light', gradient: '#ffffff' },
                { id: 'dark', label: 'dark', gradient: '#1f2229' },
                { id: 'pastel-brown', label: 'Caramel', gradient: 'linear-gradient(160deg, #f6d365 0%, #c68a4a 100%)' },
                {
                  id: 'pastel-pink',
                  label: 'Cotton Candy',
                  gradient: 'linear-gradient(160deg, #f6d5f7 0%, #ffb8de 100%)',
                },
                {
                  id: 'pastel-green',
                  label: 'Mint Chip',
                  gradient: 'linear-gradient(160deg, #7bd7c4 0%, #a8e08f 100%)',
                },
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
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-border-default shadow-sm"
                    style={
                      t.gradient.startsWith('#') ? { backgroundColor: t.gradient } : { backgroundImage: t.gradient }
                    }
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative hidden @md:block" ref={menuRef}>
        <button
          onClick={handleProfileClick}
          className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 focus:outline-none ring-1 ring-black/5">
          <Avatar
            seed={getCurrentUserId() ?? userName}
            imageUrl={userImage}
            alt="사용자"
            size={40}
            showPresence={false}
          />
          <div
            className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-bg-canvas ${
              status === '오프라인' ? 'bg-presence-offline' : statusColor
            }`}
            style={
              status === '오프라인' ? { boxShadow: 'inset 0 0 0 1px var(--color-presence-offline-border)' } : undefined
            }
          />
        </button>

        {isMenuOpen && (
          <ProfileDropdown
            isSelf={true}
            userName={userName}
            currentStatus={status}
            userImage={userImage}
            statusMessage={statusMessage}
            seed={getCurrentUserId() ?? userName}
            onStatusChange={onStatusChange}
            onStatusMessageChange={onStatusMessageChange}
            onImageUpload={() => fileInputRef.current?.click()}
            onLogout={handleLogout}
          />
        )}
      </div>

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
