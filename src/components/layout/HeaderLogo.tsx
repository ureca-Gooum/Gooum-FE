import { useEffect, useRef, useState } from 'react';

import frame1 from '@/assets/loading/frame1_top.png';
import frame2 from '@/assets/loading/frame2_topright.png';
import frame3 from '@/assets/loading/frame3_right.png';
import frame4 from '@/assets/loading/frame4_bottomright.png';
import frame5 from '@/assets/loading/frame5_bottom.png';
import frame6 from '@/assets/loading/frame6_bottomleft.png';
import frame7 from '@/assets/loading/frame7_left.png';
import frame8 from '@/assets/loading/frame8_topleft.png';

const SPIN_FRAMES = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, frame8];
const SPIN_INTERVAL_MS = 90; // 숫자가 작을수록 더 빠르게 돈다

export function HeaderLogo() {
  const [isHovered, setIsHovered] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (isHovered) {
      intervalRef.current = window.setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % SPIN_FRAMES.length);
      }, SPIN_INTERVAL_MS);
    } else {
      setFrameIndex(0); // 마우스가 떠나면 처음(기본 로고)으로 리셋
    }

    return () => window.clearInterval(intervalRef.current);
  }, [isHovered]);

  return (
    <div
      className="group relative flex h-10 w-10 shrink-0 items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div className="relative z-10 h-10 w-10 shrink-0">
        <img
          src={isHovered ? SPIN_FRAMES[frameIndex] : '/GOOUM.png'}
          alt="구움"
          className="h-full w-full object-contain"
        />
      </div>

      {/* GOOUM 텍스트: CSS group-hover로 펼쳐진다 (JS 상태와 무관하게 항상 동작) */}
      <div className="relative z-0 -ml-3 w-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-out group-hover:w-[76px]">
        <span className="whitespace-nowrap pl-4 text-[15px] font-extrabold tracking-tight text-brand-primary">
          GOOUM
        </span>
      </div>
    </div>
  );
}
