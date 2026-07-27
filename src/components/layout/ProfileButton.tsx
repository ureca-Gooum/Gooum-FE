import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '@/assets/Avatar.svg';
import { ProfileDropdown } from './ProfileDropdown';
import { USER_STATUS_CONFIG } from '@/types/user';
import { getAvatarColorClass } from '@/utils/avatar';
import { getCurrentUserId } from '@/constants/auth';
import { useMyProfile } from '@/hooks/useMyProfile';
import { logout } from '@/api/users';

interface ProfileButtonProps {
  className?: string;
  dropdownClassName?: string;
}

export function ProfileButton({ className = '', dropdownClassName = '' }: ProfileButtonProps) {
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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadImage(file);
  };

  const handleProfileClick = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsMenuOpen(false);
      return;
    }
    setIsMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusColor = USER_STATUS_CONFIG[status]?.color || 'bg-fg-disabled';

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
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
          className={dropdownClassName}
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
  );
}
