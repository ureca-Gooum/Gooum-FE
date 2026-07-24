import { useState } from 'react';
import { getAvatarColorClass } from '@/utils/avatar';
import mascotIcon from '@/assets/Avatar.svg';
import type { PresenceStatus } from '@/types/chat';

interface AvatarProps {
  seed: string;
  imageUrl?: string | null;
  size?: number;
  presence?: PresenceStatus;
  alt?: string;
  /**
   * 그룹 채팅방용: 이미지/상태 대신 인원수만 보여주는 뱃지로 렌더링한다.
   * (예: 채팅 리스트에서 그룹방은 개인 상태 없이 인원수만 표시)
   */
  memberCount?: number;
}

export function Avatar({ seed, imageUrl, size = 32, presence = 'offline', alt = '사용자', memberCount }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(imageUrl) && !imgError;
  const bgColorClass = getAvatarColorClass(seed);
  const presenceRingStyle = {
    boxShadow: '0 0 0 2px var(--color-bg-canvas)',
  };

  if (memberCount !== undefined) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full ${bgColorClass}`}
        style={{ width: size, height: size }}
        title={`${memberCount}명`}>
        <span className="font-semibold text-white" style={{ fontSize: size * 0.38 }}>
          {memberCount}
        </span>
      </div>
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {showImage ? (
        <img
          src={imageUrl!}
          alt={alt}
          onError={() => setImgError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center rounded-full ${bgColorClass}`}>
          <img
            src={mascotIcon}
            alt={alt}
            className="object-contain"
            style={{ width: size * 0.62, height: size * 0.62 }}
          />
        </div>
      )}

      {presence !== 'offline' ? (
        <span
          className={`absolute right-0 bottom-0 rounded-full border-2 border-bg-default ${
            presence === 'online' ? 'bg-presence-online' : 'bg-presence-away'
          }`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      ) : (
        <span
          className="absolute right-0 bottom-0 rounded-full border-2 border-fg-disabled bg-presence-offline"
          style={{ width: size * 0.28, height: size * 0.28, ...presenceRingStyle }}
        />
      )}
    </div>
  );
}
