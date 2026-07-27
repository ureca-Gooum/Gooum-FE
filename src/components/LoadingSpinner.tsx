import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

import frame1 from '@/assets/loading/frame1_top.png';
import frame2 from '@/assets/loading/frame2_topright.png';
import frame3 from '@/assets/loading/frame3_right.png';
import frame4 from '@/assets/loading/frame4_bottomright.png';
import frame5 from '@/assets/loading/frame5_bottom.png';
import frame6 from '@/assets/loading/frame6_bottomleft.png';
import frame7 from '@/assets/loading/frame7_left.png';
import frame8 from '@/assets/loading/frame8_topleft.png';

const FRAMES = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, frame8];
const LOADING_MESSAGES = [
  '🔥 맛있는 감자를 굽고 있어요...',
  '🥔 노릇노릇 구워지는 중...',
  '🔥 오븐을 따뜻하게 데우고 있어요...',
  '🥔 포슬포슬 감자를 익히는 중...',
];

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message, className }: LoadingSpinnerProps) {
  const [randomMessage, setRandomMessage] = useState(LOADING_MESSAGES[0]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!message) {
      setRandomMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }
  }, [message]);

  useEffect(() => {
    const id = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAMES.length);
    }, 130);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 ${className || 'flex-1 h-full w-full min-h-[300px]'}`}>
      <motion.div
        className="relative w-24 h-24"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}>
        <AnimatePresence>
          <motion.img
            key={frameIndex}
            src={FRAMES[frameIndex]}
            alt="Loading"
            className="absolute inset-0 w-24 h-24 object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.13, ease: 'linear' }}
          />
        </AnimatePresence>
      </motion.div>
      <motion.p
        className="text-sm font-semibold text-fg-tertiary"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
        {message || randomMessage}
      </motion.p>
    </div>
  );
}
