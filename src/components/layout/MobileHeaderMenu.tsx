import { useState, useRef, useEffect } from 'react';
import { MoreVertical, User, Palette, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyProfile } from '@/hooks/useMyProfile';
import { ProfileDropdown } from './ProfileDropdown';
import { getCurrentUserId } from '@/constants/auth';
import { disconnectSocket } from '@/socket/socket';
import { logout } from '@/api/users';

export function MobileHeaderMenu() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('gooum-theme') || 'light';
  });

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
    if (e.target) e.target.value = '';
    if (!file) return;
    await uploadImage(file);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    setIsProfileModalOpen(false);
    try {
      await logout();
    } catch (error) {
      console.warn('백엔드 로그아웃 처리 중 에러 발생:', error);
    } finally {
      disconnectSocket();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('gooum_cached_documents');
      localStorage.removeItem('gooum_doc_files');
      resetLocalState();
      navigate('/login');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 토큰 유무로 로그인 여부 확인
  const isLoggedIn = !!localStorage.getItem('accessToken');
  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={menuRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      <button
        onClick={() => {
          setIsMenuOpen(!isMenuOpen);
          setIsThemeMenuOpen(false);
        }}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
          isMenuOpen ? 'bg-bg-subtle text-fg-primary' : 'text-fg-tertiary hover:bg-bg-subtle hover:text-fg-primary'
        }`}
      >
        <MoreVertical size={20} />
      </button>

      {/* 기본 드롭다운 메뉴 */}
      {isMenuOpen && !isThemeMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border-default bg-bg-default shadow-lg z-50 p-2 flex flex-col gap-1">
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setIsProfileModalOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg-primary hover:bg-bg-subtle transition-colors text-left"
          >
            <User size={16} className="text-fg-tertiary" />
            프로필 설정
          </button>
          
          <button
            onClick={() => {
              setIsThemeMenuOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg-primary hover:bg-bg-subtle transition-colors text-left"
          >
            <Palette size={16} className="text-fg-tertiary" />
            테마
          </button>

          <div className="h-px w-full bg-border-default my-1" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left font-medium"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      )}

      {/* 테마 선택 서브메뉴 */}
      {isMenuOpen && isThemeMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border-default bg-bg-default shadow-lg z-50 p-2 flex flex-col gap-1">
          <div className="flex items-center mb-1 px-1">
            <button
              onClick={() => setIsThemeMenuOpen(false)}
              className="text-fg-tertiary hover:text-fg-primary p-1 mr-1 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className="text-xs font-semibold text-fg-secondary">테마 선택</span>
          </div>
          
          {[
            { id: 'light', label: 'light', gradient: '#ffffff' },
            { id: 'dark', label: 'dark', gradient: '#1f2229' },
            { id: 'pastel-brown', label: 'Caramel', gradient: 'linear-gradient(160deg, #f6d365 0%, #c68a4a 100%)' },
            { id: 'pastel-pink', label: 'Cotton Candy', gradient: 'linear-gradient(160deg, #f6d5f7 0%, #ffb8de 100%)' },
            { id: 'pastel-green', label: 'Mint Chip', gradient: 'linear-gradient(160deg, #7bd7c4 0%, #a8e08f 100%)' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setIsMenuOpen(false);
                setIsThemeMenuOpen(false);
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                theme === t.id
                  ? 'bg-bg-subtle text-brand-primary font-medium'
                  : 'text-fg-primary hover:bg-bg-subtle'
              }`}
            >
              <div
                className="h-3.5 w-3.5 shrink-0 rounded-full border border-border-default shadow-sm"
                style={t.gradient.startsWith('#') ? { backgroundColor: t.gradient } : { backgroundImage: t.gradient }}
              />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* 프로필 모달 오버레이 */}
      {isProfileModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[99] backdrop-blur-[1px] transition-opacity"
            onClick={() => setIsProfileModalOpen(false)}
          />
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
          />
        </>
      )}
    </div>
  );
}
