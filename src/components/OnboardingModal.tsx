import { useState } from 'react';
import { X, MessageSquare, Sparkles, Users, ChevronRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

const slides = [
  {
    icon: <MessageSquare size={44} className="text-white" />,
    title: '실시간으로 연결되는 우리',
    desc: '동료들과 언제 어디서나 다이렉트 및 그룹 채팅으로 끊김 없이 의견을 나누세요.',
    bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    shadow: 'shadow-indigo-500/40',
  },
  {
    icon: <Sparkles size={44} className="text-white" />,
    title: '똑똑한 AI 대화방 요약',
    desc: '길어진 대화도 문제없어요. AI가 채팅 내용을 핵심만 빠르고 정확하게 요약해 드립니다.',
    bg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600',
    shadow: 'shadow-purple-500/40',
  },
  {
    icon: <Users size={44} className="text-white" />,
    title: '실시간 회의록 & 동시 편집',
    desc: '채팅과 동시에 여러 명과 함께 회의록과 문서를 실시간으로 작성하고 편집할 수 있어요.',
    bg: 'bg-gradient-to-br from-teal-400 to-emerald-600',
    shadow: 'shadow-emerald-500/40',
  },
];

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState<'question' | 'intro'>('question');
  const [slide, setSlide] = useState(0);
  const [hideNextTime, setHideNextTime] = useState(false);

  const handleClose = () => {
    if (hideNextTime) {
      localStorage.setItem('gooum_hide_onboarding', 'true');
    }
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
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md transition-opacity">
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

        <div className="mt-6 flex items-center justify-center border-t border-border-default pt-6">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-fg-tertiary transition-colors hover:text-fg-secondary">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={hideNextTime}
                onChange={(e) => setHideNextTime(e.target.checked)}
                className="peer h-4 w-4 appearance-none rounded border border-border-default bg-bg-canvas checked:border-brand-primary checked:bg-brand-primary transition-all cursor-pointer"
              />
              <Check
                size={12}
                className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                strokeWidth={3}
              />
            </div>
            다시 표시하지 않음
          </label>
        </div>
      </div>
    </div>
  );
}
