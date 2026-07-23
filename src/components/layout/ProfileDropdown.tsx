import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Camera } from 'lucide-react';
import { USER_STATUS_CONFIG, type UserStatus } from '@/types/user';
import defaultAvatar from '@/assets/Avatar.svg';

interface ProfileDropdownProps {
  userName: string;
  currentStatus: UserStatus;
  userImage?: string | null;
  statusMessage?: string;
  isSelf?: boolean; // 내 프로필인지 여부 (기본값 false 또는 true로 조절)
  onStatusChange?: (newStatus: UserStatus) => void;
  onLogout?: () => void;
  onImageUpload?: () => void;
  onStatusMessageChange?: (newMessage: string) => Promise<void> | void;
}

export function ProfileDropdown({
  userName,
  currentStatus,
  userImage,
  statusMessage = '',
  isSelf = false, // 기본적으로 상대방 프로필 모드로 작동하게 설정
  onStatusChange,
  onLogout,
  onImageUpload,
  onStatusMessageChange,
}: ProfileDropdownProps) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempMessage, setTempMessage] = useState(statusMessage);
  const [prevStatusMessage, setPrevStatusMessage] = useState(statusMessage);
  const inputRef = useRef<HTMLInputElement>(null);

  if (prevStatusMessage !== statusMessage) {
    setPrevStatusMessage(statusMessage);
    setTempMessage(statusMessage);
  }

  useEffect(() => {
    if (isEditing && isSelf) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, isSelf]);

  const currentStatusColor = USER_STATUS_CONFIG[currentStatus]?.color || 'bg-fg-disabled';

  const handleSaveMessage = async () => {
    setIsEditing(false);
    const trimmed = tempMessage.trim();

    if (onStatusMessageChange && trimmed !== statusMessage) {
      try {
        await onStatusMessageChange(trimmed);
      } catch {
        setTempMessage(statusMessage);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveMessage();
    } else if (e.key === 'Escape') {
      setTempMessage(statusMessage);
      setIsEditing(false);
    }
  };

  return (
    <div className="absolute bottom-12 left-12 w-[240px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-gray-100 p-4 z-50 transform origin-bottom-left transition-all text-gray-800">
      {/* 1. 상단 프로필 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {/* 내 프로필일 때만 카메라 툴팁 표시 */}
            {isSelf && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 pointer-events-none transition-all duration-200 z-20 whitespace-nowrap">
                <div className="bg-gray-900/90 text-white text-[10px] font-medium px-2 py-1 rounded-md shadow-md backdrop-blur-sm">
                  프로필 사진 변경
                </div>
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-900/90 mx-auto" />
              </div>
            )}

            {/* 아바타 영역 (내 프로필이면 클릭 가능, 상대방이면 클릭 안 됨) */}
            <div
              onClick={isSelf ? onImageUpload : undefined}
              className={`relative w-12 h-12 shrink-0 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-black/5 overflow-hidden ${
                isSelf ? 'cursor-pointer' : ''
              }`}>
              <img
                src={userImage || defaultAvatar}
                alt="사용자"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                }}
              />
              {/* 내 프로필일 때만 카메라 마스크 보여주기 */}
              {isSelf && (
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[1px]">
                  <Camera size={16} className="text-white drop-shadow-sm" />
                </div>
              )}
            </div>
          </div>

          {/* 이름 & 현재 상태 */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold text-gray-900 leading-tight">{userName}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2.5 h-2.5 rounded-full ${currentStatusColor}`} />
              <span className="text-[12px] text-gray-600 font-medium">{currentStatus}</span>
            </div>
          </div>
        </div>

        {/* 내 프로필일 때만 로그아웃 버튼 노출 */}
        {isSelf && onLogout && (
          <button
            onClick={onLogout}
            className="text-[12px] text-gray-500 hover:text-red-500 transition-colors pt-0.5 font-medium shrink-0">
            로그아웃
          </button>
        )}
      </div>

      {/* 2. 상태 선택 영역 (내 프로필일 때만 변경 가능) */}
      {isSelf && onStatusChange && (
        <div className="relative mt-3">
          <button
            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
            className="w-full flex items-center justify-between py-1.5 px-1 hover:bg-gray-50 rounded-lg transition-colors group">
            <span className="text-[13px] font-medium text-gray-700">{currentStatus}</span>
            <ChevronRight
              size={16}
              className={`text-gray-400 transition-transform ${isStatusMenuOpen ? 'rotate-90' : ''}`}
            />
          </button>

          {isStatusMenuOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg p-1.5 z-10 flex flex-col gap-0.5">
              {Object.values(USER_STATUS_CONFIG).map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() => {
                    onStatusChange(label);
                    setIsStatusMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors w-full text-left ${
                    currentStatus === label ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-600'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. 하단 상태 메시지 박스 */}
      <div
        onDoubleClick={() => isSelf && setIsEditing(true)}
        className={`relative group mt-2 bg-gray-50 rounded-xl p-3 pb-5 min-h-[52px] flex items-start border border-transparent overflow-hidden ${
          isSelf ? 'hover:bg-gray-100/80 cursor-pointer hover:border-gray-200' : ''
        }`}>
        {isSelf && isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={tempMessage}
            onChange={(e) => setTempMessage(e.target.value)}
            onBlur={handleSaveMessage}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-[13px] text-gray-800 font-normal focus:outline-none p-0 border-none leading-snug"
            maxLength={50}
          />
        ) : (
          <p className="text-[13px] text-gray-700 font-normal leading-snug break-all select-none">
            {statusMessage || (isSelf ? '상태 메시지를 입력하세요' : '설정된 상태 메시지가 없습니다.')}
          </p>
        )}

        {isSelf && !isEditing && (
          <span className="absolute bottom-1 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-gray-400 font-medium pointer-events-none select-none">
            더블 클릭하여 수정
          </span>
        )}
      </div>
    </div>
  );
}
