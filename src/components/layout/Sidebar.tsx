import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, FileText } from 'lucide-react';
import axios from 'axios';
import defaultAvatar from '@/assets/Avatar.svg';
import { ProfileDropdown } from './ProfileDropdown';
import { USER_STATUS_CONFIG, type UserStatus } from '@/types/user';
import type { PresenceStatus } from '@/types/chat';
import { getAvatarColorClass } from '@/utils/avatar';
import { getCurrentUserId } from '@/constants/auth';
import api from '@/api/axiosInstance';
import { getSocket } from '@/socket/socket';
import { logout } from '@/api/users';

const navItems = [
  { icon: Bell, label: '알림', to: '/app/notifications' },
  { icon: MessageCircle, label: 'DM', to: '/app' },
  { icon: FileText, label: '문서', to: '/app/docs' },
];

const STATUS_TO_SERVER: Record<UserStatus, PresenceStatus> = {
  '대화 가능': 'online',
  '자리 비움': 'away',
  '방해 금지': 'busy',
  오프라인: 'offline',
};

const SERVER_TO_STATUS: Record<string, UserStatus> = {
  online: '대화 가능',
  away: '자리 비움',
  busy: '방해 금지',
  offline: '오프라인',
};

export function Sidebar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState('사용자');
  const [status, setStatus] = useState<UserStatus>('대화 가능');
  const [statusMessage, setStatusMessage] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  // 프로필 이미지 로드 실패 시 채팅 리스트 아바타와 동일하게 배경색 있는 마스코트 아이콘으로 대체
  const [profileImgError, setProfileImgError] = useState(false);

  // 1. 프로필 정보 조회 (GET)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/users/me');
        if (response.data.name) setUserName(response.data.name);

        const serverPresence = response.data.presence?.status || response.data.status;
        if (serverPresence) {
          const mappedStatus = SERVER_TO_STATUS[serverPresence] || serverPresence;
          setStatus(mappedStatus as UserStatus);
        }

        if (response.data.statusMessage !== undefined) {
          setStatusMessage(response.data.statusMessage);
        }

        const profileImg =
          response.data.profileImageUrl || response.data.profile_image_url || response.data.profileImage;
        if (profileImg) {
          setUserImage(profileImg);
          setProfileImgError(false);
        }
      } catch (error) {
        console.error('프로필 조회 실패:', error);
      }
    };
    fetchProfile();
  }, []);

  // 2. 프레즌스 상태 변경 (Socket + PATCH)
  const onStatusChange = async (selectedLabel: UserStatus) => {
    const serverStatus = STATUS_TO_SERVER[selectedLabel];
    if (!serverStatus) return;

    setStatus(selectedLabel);

    const socket = getSocket();

    type SocketResponse = {
      success?: boolean;
      message?: string;
    };

    socket?.emit('updatePresence', { status: serverStatus }, (res: SocketResponse) => {
      console.log('상태 변경 소켓 응답:', res);
    });

    try {
      await api.patch('/api/users/me', {
        presence: { status: serverStatus },
      });
    } catch (error) {
      console.error('DB 프레즌스 업데이트 실패:', error);
    }
  };

  // 3. 상태 메시지 변경 (PATCH)
  const handleStatusMessageChange = async (newMessage: string) => {
    try {
      await api.patch('/api/users/me', { statusMessage: newMessage });
      setStatusMessage(newMessage);
    } catch (error) {
      console.error('상태 메시지 수정 실패:', error);
      alert('상태 메시지 수정에 실패했습니다.');
      throw error;
    }
  };

  // 4. 프로필 이미지 업로드 (1단계: /api/upload -> 2단계: PATCH /api/users/me)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 명세서 기준 5MB 제한 체크
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 용량은 5MB 이하만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1단계: Azure Blob Storage 파일 업로드
      const uploadResponse = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newImageUrl = uploadResponse.data?.fileUrl;

      if (!newImageUrl) {
        throw new Error('이미지 URL을 받아오지 못했습니다.');
      }

      // 2단계: 내 프로필 정보(profileImageUrl) PATCH 업데이트
      await api.patch('/api/users/me', {
        profileImageUrl: newImageUrl,
      });

      // 3단계: 프론트 UI 반영
      setUserImage(newImageUrl);
      setProfileImgError(false);
    } catch (error: unknown) {
      console.error('프로필 사진 변경 실패:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        if (status === 400) {
          alert(serverMessage || '파일 업로드 실패 (400)');
        } else if (status === 401) {
          alert('인증이 필요합니다. 다시 로그인해 주세요.');
        } else {
          alert('프로필 사진 변경에 실패했습니다.');
        }
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      e.target.value = '';
    }
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
      setUserName('사용자');
      setUserImage(null);
      setStatus('오프라인');
      setStatusMessage('');

      // 3. 로그인 페이지로 이동
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

      <div className="relative mt-auto" ref={menuRef}>
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
            onStatusMessageChange={handleStatusMessageChange}
            onImageUpload={() => fileInputRef.current?.click()}
            onLogout={handleLogout}
          />
        )}
      </div>
    </aside>
  );
}
