import { useState, useEffect } from 'react';
import loginIllustration from '@/assets/login-illustration.png';

const LOADING_MESSAGES = [
  "맛있는 빵을 굽고 있어요...",
  "바삭한 쿠키를 굽는 중...",
  "따뜻한 오븐을 데우고 있어요...",
  "달콤한 케이크를 장식하는 중..."
];

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message, className }: LoadingSpinnerProps) {
  const [randomMessage, setRandomMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    if (!message) {
      const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
      setRandomMessage(LOADING_MESSAGES[randomIndex]);
    }
  }, [message]);

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className || 'flex-1 h-full w-full min-h-[300px]'}`}>
      <img 
        src={loginIllustration} 
        alt="Loading" 
        className="w-24 h-24 object-contain animate-bounce"
      />
      <p className="text-sm font-semibold text-fg-tertiary animate-pulse">
        {message || randomMessage}
      </p>
    </div>
  );
}
