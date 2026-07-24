import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, FileText, Palette } from 'lucide-react';
import defaultAvatar from '@/assets/Avatar.svg';
import { ProfileDropdown } from './ProfileDropdown';
import { USER_STATUS_CONFIG } from '@/types/user';
import { getAvatarColorClass } from '@/utils/avatar';
import { getCurrentUserId } from '@/constants/auth';
import { useMyProfile } from '@/hooks/useMyProfile';
import { logout } from '@/api/users';

const navItems = [
  { icon: Bell, label: '알림', to: '/app/notifications' },
  { icon: MessageCircle, label: 'DM', to: '/app' },
  { icon: FileText, label: '문서', to: '/app/docs' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    userName,
    status,
    statusMessage,
    userImage,
    profileImgError,
    setProfileImgError,
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
      // 1. 스토리지 정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('gooum_cached_documents');
      localStorage.removeItem('gooum_doc_files');

      // 2. 프로필 및 사용자 상태 초기화 (이미지 잔상 제거)
      resetLocalState();

      // 3. 로그인 페이지로 이동
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
    <aside className="flex w-16 shrink-0 flex-col items-center justify-between pb-4 bg-bg-canvas relative h-full">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />

      <div className="flex w-full flex-col items-center gap-4">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/app'}
            onClick={(e) => {
              if (label === '알림' && !localStorage.getItem('accessToken')) {
                e.preventDefault();
                alert('로그인 후 이용해주세요.');
              }
            }}
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

      <div className="relative mt-auto mb-4 flex flex-col items-center" ref={themeMenuRef}>
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
          <div className="absolute left-14 bottom-0 w-32 rounded-xl border border-border-default bg-bg-default p-2 shadow-lg z-50">
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

      <div className="relative" ref={menuRef}>
        <button
          onClick={handleProfileClick}
          className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 focus:outline-none ring-1 ring-black/5">
          {userImage && !profileImgError ? (
            <img
              src={userImage}
              alt="사용자"
              className="w-full h-full rounded-full object-cover"
              onError={() => setProfileImgError(true)}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center rounded-full ${getAvatarColorClass(
                getCurrentUserId() ?? userName,
              )}`}>
              <img
                src={defaultAvatar}
                alt="사용자"
                className="object-contain"
                style={{ width: 40 * 0.62, height: 40 * 0.62 }}
              />
            </div>
          )}
          <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${statusColor} ring-2 ring-bg-canvas`} />
        </button>

        {isMenuOpen && (
          <ProfileDropdown
            isSelf={true}
            userName={userName}
            currentStatus={status}
            userImage={userImage}
            statusMessage={statusMessage}
            onStatusChange={onStatusChange}
            onStatusMessageChange={onStatusMessageChange}
            onImageUpload={() => fileInputRef.current?.click()}
            onLogout={handleLogout}
          />
        )}
      </div>
    </aside>
  );
}
