import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/api/axiosInstance';
import { getSocket } from '@/socket/socket';
import { USER_STATUS_CONFIG, type UserStatus } from '@/types/user';
import type { PresenceStatus } from '@/types/chat';

export const STATUS_TO_SERVER: Record<UserStatus, PresenceStatus> = {
  '대화 가능': 'online',
  '자리 비움': 'away',
  '방해 금지': 'busy',
  오프라인: 'offline',
};

export const SERVER_TO_STATUS: Record<string, UserStatus> = {
  online: '대화 가능',
  away: '자리 비움',
  busy: '방해 금지',
  offline: '오프라인',
};

/**
 * 로그인한 "내 프로필" 상태(이름/상태/상태메시지/프로필사진)를 조회·수정하는 로직.
 * Sidebar의 프로필 팝업과 채팅 멘션에서 "내 멘션에 호버했을 때" 뜨는 프로필 카드가
 * 서로 다른 상태를 들고 있지 않도록 여기 하나로 모아서 공유한다.
 *
 * @param enabled false면 조회 자체를 하지 않는다. (예: 다른 사람 멘션 카드를 그릴 때는 불필요)
 */
export function useMyProfile(enabled: boolean = true) {
  const [userName, setUserName] = useState('사용자');
  const [status, setStatus] = useState<UserStatus>('대화 가능');
  const [statusMessage, setStatusMessage] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [profileImgError, setProfileImgError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await api.get('/api/users/me');
        if (cancelled) return;

        if (response.data.name) setUserName(response.data.name);

        const serverPresence = response.data.presence?.status || response.data.status;
        if (serverPresence) {
          setStatus((SERVER_TO_STATUS[serverPresence] || serverPresence) as UserStatus);
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
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const onStatusChange = async (selectedLabel: UserStatus) => {
    const serverStatus = STATUS_TO_SERVER[selectedLabel];
    if (!serverStatus) return;

    setStatus(selectedLabel);

    const socket = getSocket();
    type SocketResponse = { success?: boolean; message?: string };
    socket?.emit('updatePresence', { status: serverStatus }, (res: SocketResponse) => {
      console.log('상태 변경 소켓 응답:', res);
    });

    try {
      await api.patch('/api/users/me', { presence: { status: serverStatus } });
    } catch (error) {
      console.error('DB 프레즌스 업데이트 실패:', error);
    }
  };

  const onStatusMessageChange = async (newMessage: string) => {
    try {
      await api.patch('/api/users/me', { statusMessage: newMessage });
      setStatusMessage(newMessage);
    } catch (error) {
      console.error('상태 메시지 수정 실패:', error);
      alert('상태 메시지 수정에 실패했습니다.');
      throw error;
    }
  };

  const uploadImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 용량은 5MB 이하만 업로드 가능합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newImageUrl = uploadResponse.data?.fileUrl;
      if (!newImageUrl) throw new Error('이미지 URL을 받아오지 못했습니다.');

      await api.patch('/api/users/me', { profileImageUrl: newImageUrl });

      setUserImage(newImageUrl);
      setProfileImgError(false);
    } catch (error: unknown) {
      console.error('프로필 사진 변경 실패:', error);
      if (axios.isAxiosError(error)) {
        const httpStatus = error.response?.status;
        const serverMessage = error.response?.data?.message;
        if (httpStatus === 400) alert(serverMessage || '파일 업로드 실패 (400)');
        else if (httpStatus === 401) alert('인증이 필요합니다. 다시 로그인해 주세요.');
        else alert('프로필 사진 변경에 실패했습니다.');
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const resetLocalState = () => {
    setUserName('사용자');
    setUserImage(null);
    setStatus('오프라인');
    setStatusMessage('');
  };

  const statusColor = USER_STATUS_CONFIG[status]?.color || 'bg-fg-disabled';

  return {
    userName,
    status,
    statusMessage,
    userImage,
    profileImgError,
    setProfileImgError,
    statusColor,
    onStatusChange,
    onStatusMessageChange,
    uploadImage,
    resetLocalState,
  };
}
