import { useState } from 'react';
import { getAvatarColorClass } from '@/utils/avatar';
import mascotIcon from '@/assets/Avatar.svg';

interface AvatarProps {
  seed: string;
  imageUrl?: string | null;
  size?: number;
  isOnline?: boolean;
  alt?: string;
}

export function Avatar({ seed, imageUrl, size = 32, isOnline = false, alt = '사용자' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(imageUrl) && !imgError;
  const bgColorClass = getAvatarColorClass(seed);

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

      {isOnline && (
        <span
          className="absolute right-0 bottom-0 rounded-full border-2 border-bg-default bg-success"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
