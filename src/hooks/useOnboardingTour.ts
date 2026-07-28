import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver, type DriveStep } from 'driver.js';

const ONBOARDING_DONE_KEY = 'gooum_onboarding_done';

const AI_SUMMARY_MOCKUP = `
  <svg width="230" height="72" viewBox="0 0 230 72" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 12px">
    <rect x="1" y="1" width="228" height="70" rx="12" fill="var(--color-bg-default)" stroke="var(--color-border-default)" stroke-width="1.5" />
    <text x="14" y="26" font-size="12" fill="var(--color-fg-tertiary)" font-family="inherit">메시지를 입력하세요</text>
    <line x1="10" y1="44" x2="220" y2="44" stroke="var(--color-border-default)" stroke-width="1" />
    <rect x="145" y="52" width="10" height="12" rx="1.5" fill="none" stroke="var(--color-fg-tertiary)" stroke-width="1.4" />
    <line x1="166" y1="51" x2="166" y2="65" stroke="var(--color-border-default)" stroke-width="1" />
    <circle cx="186" cy="58" r="13" fill="var(--color-brand-soft)" stroke="var(--color-brand-primary)" stroke-width="2" />
    <path d="M186 52 L187.3 56.2 L191.5 57.5 L187.3 58.8 L186 63 L184.7 58.8 L180.5 57.5 L184.7 56.2 Z" fill="var(--color-brand-primary)" />
    <line x1="202" y1="51" x2="202" y2="65" stroke="var(--color-border-default)" stroke-width="1" />
    <path d="M212 52 L222 58 L212 64 L214 58 Z" fill="var(--color-fg-tertiary)" />
  </svg>`;

export function useOnboardingTour() {
  const navigate = useNavigate();
  const location = useLocation();

  const buildSteps = useCallback((): DriveStep[] => {
    const exists = (selector: string) => !!document.querySelector(selector);

    const aiSummaryStep: DriveStep = exists('[data-tour="ai-summary"]')
      ? {
          element: '[data-tour="ai-summary"]',
          popover: {
            title: 'AI 회의록 버튼',
            description: '요약하고 싶은 메시지 구간을 선택하고 이 버튼을 누르면 AI가 회의록처럼 정리해줘요.',
            side: 'top',
            align: 'end',
          },
        }
      : {
          popover: {
            title: 'AI 회의록 버튼',
            description:
              AI_SUMMARY_MOCKUP +
              '채팅방을 열면 입력창 오른쪽에 AI 회의록 버튼이 있어요. 요약하고 싶은 메시지 구간을 선택하고 눌러보세요.',
          },
        };

    return [
      {
        element: '[data-tour="new-chat"]',
        popover: {
          title: '친구와 대화 시작하기',
          description: '대화하고 싶은 친구를 선택하면 다이렉트든 그룹이든 바로 시작할 수 있어요.',
          side: 'bottom',
          align: 'start',
        },
      },
      aiSummaryStep,
      {
        element: '[data-tour="nav-docs"]',
        popover: {
          title: '문서로 함께 작업하기',
          description:
            '여기서 새 문서를 만들 수도 있고, 동료와 실시간으로 편집 중인 문서를 모아볼 수도 있어요. 채팅 중이라면 입력창의 문서 아이콘으로 바로 만들 수도 있어요.',
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '[data-tour="search"]',
        popover: {
          title: '찾고 싶은 걸 바로',
          description: '사람, 채팅방, 메시지, 문서까지 한 번에 검색할 수 있어요.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="nav-notifications"]',
        popover: {
          title: '새 소식은 여기서',
          description: '멘션이나 초대 같은 알림을 확인할 수 있어요.',
          side: 'right',
          align: 'center',
        },
      },
    ];
  }, []);

  const markDone = useCallback(() => {
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  }, []);

  const startTour = useCallback(() => {
    const run = () => {
      const tour = driver({
        showProgress: true,
        allowClose: false,
        overlayOpacity: 0.5,
        disableActiveInteraction: true,
        nextBtnText: '다음',
        prevBtnText: '이전',
        doneBtnText: '시작하기',
        progressText: '{{current}} / {{total}}',
        steps: buildSteps(),
        onDestroyStarted: () => {
          // '다음'을 끝까지 눌러 완료했든, 중간에 닫기(X)를 눌러 건너뛰었든
          // 동일하게 완료 처리해서 다음 접속부터 다시 뜨지 않게 한다.
          markDone();
          tour.destroy();
        },
      });

      tour.drive();
    };

    // '/app' 라우트에 있어야 보이는 요소들이 있으므로, 다른 페이지에서
    // 투어를 시작한 경우 먼저 이동한 뒤 DOM이 그려지길 한 프레임 기다린다.
    if (location.pathname !== '/app') {
      navigate('/app');
      requestAnimationFrame(() => requestAnimationFrame(run));
    } else {
      run();
    }
  }, [location.pathname, navigate, markDone, buildSteps]);

  const hasSeenOnboarding = useCallback(() => {
    return localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
  }, []);

  return { startTour, hasSeenOnboarding, markDone };
}
