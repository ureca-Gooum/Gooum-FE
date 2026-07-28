import { useState } from 'react';
import { X, MessageSquare, Sparkles, Users, UserPlus, ChevronRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  onStartTour?: () => void;
}

const slides = [
  {
    icon: <UserPlus size={44} className="text-white" />,
    title: '친구를 콕 골라볼까요?',
    desc: '뜨끈한 감자 고르듯, 대화하고 싶은 친구를 콕 선택하면 다이렉트든 그룹이든 바로 대화가 시작돼요.',
    bg: 'bg-gradient-to-br from-amber-400 to-orange-600',
    shadow: 'shadow-orange-500/40',
  },
  {
    icon: <MessageSquare size={44} className="text-white" />,
    title: '따끈따끈 실시간 대화',
    desc: '언제 어디서든 김이 모락모락 나는 감자처럼 따끈하게, 끊김 없이 이야기를 나눠보세요.',
    bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    shadow: 'shadow-indigo-500/40',
  },
  {
    icon: <Sparkles size={44} className="text-white" />,
    title: '한 입에 쏙, AI 요약',
    desc: '길어진 대화도 걱정 마세요. AI가 알맹이만 쏙 골라 부드럽게 요약해 드려요.',
    bg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600',
    shadow: 'shadow-purple-500/40',
  },
  {
    icon: <Users size={44} className="text-white" />,
    title: '다 같이 뭉근하게, 회의록',
    desc: '채팅과 동시에 여러 명이 함께 회의록과 문서를 실시간으로 뭉근하게 완성해요.',
    bg: 'bg-gradient-to-br from-teal-400 to-emerald-600',
    shadow: 'shadow-emerald-500/40',
  },
];

export function OnboardingModal({ onClose, onStartTour }: OnboardingModalProps) {
  const [step, setStep] = useState<'question' | 'intro'>('question');
  const [slide, setSlide] = useState(0);

  const handleClose = () => {
    onClose();
  };

  const handleYes = () => {
    setStep('intro');
  };

  const handleNo = () => {
    handleClose();
  };

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide((s) => s + 1);
    } else {
      // 슬라이드 소개는 그대로 두고, 마지막 '시작하기'에서 실제 화면을 짚어주는
      // driver.js 투어로 자연스럽게 이어준다.
      onClose();
      onStartTour?.();
    }
  };

  return (
    <div className="fixed @md:absolute inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-md transition-opacity">
      <div className="relative w-[480px] overflow-hidden rounded-[2rem] bg-bg-default p-8 shadow-2xl transition-all duration-500">
        <div className="absolute right-6 top-6 z-10">
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-subtle text-fg-tertiary transition-colors hover:bg-bg-muted hover:text-fg-primary">
            <X size={18} />
          </button>
        </div>

        {step === 'question' ? (
          <div className="flex flex-col items-center py-6">
            <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-soft shadow-inner">
              <div className="absolute inset-0 rounded-3xl bg-brand-primary/10 animate-ping opacity-20"></div>
              <img src="/GOOUM.png" alt="Gooum Logo" className="h-14 w-14 drop-shadow-md" />
            </div>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-fg-primary">구움이 처음이신가요?</h2>
            <p className="mb-10 text-center text-[15px] leading-relaxed text-fg-secondary">
              구움만의 특별한 기능들을 모아
              <br />
              간단한 온보딩 가이드를 준비했어요.
            </p>

            <div className="flex w-full gap-4 px-2">
              <button
                onClick={handleNo}
                className="flex-1 rounded-2xl bg-bg-canvas py-4 text-[15px] font-semibold text-fg-secondary transition-all hover:bg-bg-subtle hover:text-fg-primary active:scale-95 border border-border-default">
                아니요, 괜찮아요
              </button>
              <button
                onClick={handleYes}
                className="flex-1 rounded-2xl bg-brand-primary py-4 text-[15px] font-semibold text-white shadow-lg shadow-brand-primary/30 transition-all hover:-translate-y-0.5 hover:bg-brand-primary/90 hover:shadow-xl active:translate-y-0 active:scale-95">
                네, 볼래요!
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            {/* Sliding Track */}
            <div className="relative w-full overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${slide * 100}%)` }}>
                {slides.map((s, i) => (
                  <div key={i} className="min-w-full flex-shrink-0 flex flex-col items-center px-4 pt-4 pb-2">
                    <div
                      className={`mb-8 flex h-28 w-28 items-center justify-center rounded-3xl shadow-xl ${s.bg} ${s.shadow} transform transition-transform duration-700 ${slide === i ? 'scale-100' : 'scale-75 opacity-50'}`}>
                      {s.icon}
                    </div>
                    <h3 className="mb-4 text-2xl font-bold tracking-tight text-fg-primary text-center">{s.title}</h3>
                    <p className="max-w-[280px] text-center text-[15px] leading-relaxed text-fg-secondary">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="mb-10 mt-8 flex gap-2.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    slide === i ? 'w-8 bg-brand-primary' : 'w-2 bg-border-default hover:bg-border-hover'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex w-full items-center justify-between">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-[14px] font-medium text-fg-tertiary transition-colors hover:text-fg-primary">
                건너뛰기
              </button>

              <button
                onClick={handleNext}
                className="group flex items-center gap-2 rounded-2xl bg-fg-primary px-7 py-3.5 text-[15px] font-semibold text-bg-default shadow-lg transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-xl active:translate-y-0 active:scale-95">
                {slide === slides.length - 1 ? '시작하기' : '다음'}
                {slide === slides.length - 1 ? (
                  <Check size={18} className="transition-transform group-hover:scale-110" />
                ) : (
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
