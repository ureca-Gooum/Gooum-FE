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
  memberCount?: number;
  showPresence?: boolean;
}

export function Avatar({
  seed,
  imageUrl,
  size = 32,
  presence = 'offline',
  alt = '사용자',
  memberCount,
  showPresence = true,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(imageUrl) && !imgError;
  const bgColorClass = getAvatarColorClass(seed);

  if (memberCount !== undefined) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: size, height: size, backgroundColor: 'var(--color-fg-tertiary)' }}
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

      {showPresence &&
        (presence !== 'offline' ? (
          <span
            className={`absolute right-0 bottom-0 rounded-full border-2 border-bg-default ${
              presence === 'online' ? 'bg-presence-online' : 'bg-presence-away'
            }`}
            style={{ width: size * 0.28, height: size * 0.28 }}
          />
        ) : (
          <span
            className="absolute right-0 bottom-0 rounded-full border-2 border-bg-default bg-bg-default"
            style={{
              width: size * 0.28,
              height: size * 0.28,
              boxShadow: 'inset 0 0 0 2px var(--color-presence-offline-border)',
            }}
          />
        ))}
    </div>
  );
}
