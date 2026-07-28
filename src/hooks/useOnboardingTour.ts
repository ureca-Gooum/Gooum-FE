import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver, type DriveStep } from 'driver.js';

const ONBOARDING_DONE_KEY = 'gooum_onboarding_done';

/**
 * data-tour 속성이 붙은 실제 DOM 요소들을 순서대로 하이라이트하며
 * 툴팁(popover)을 보여주는 온보딩 투어.
 *
 * - Sidebar / Header는 MainLayout 하위 모든 라우트에 항상 떠 있으므로
 *   대부분의 step은 페이지 이동 없이 그대로 하이라이트할 수 있다.
 * - 다만 채팅 입력창처럼 '/app' 라우트에만 존재하는 요소가 있어서,
 *   투어 시작 시 먼저 '/app'으로 이동시킨 뒤 단계를 진행한다.
 * - AI 요약 버튼(ChatMessageInput)과 문서 협업자 아바타(DocsPage)는
 *   '채팅방이 열려 있을 때' / '문서가 열려 있을 때'만 DOM에 존재한다.
 *   신규 유저는 아직 채팅방/문서가 없을 수 있으므로, 요소가 없으면
 *   하이라이트 없이 중앙에 뜨는 안내 팝오버로 자연스럽게 대체한다.
 *   (요소가 없는데 selector만 넘기면 이전에 겪었던 것처럼 하이라이트/팝오버
 *   위치가 깨지므로, 반드시 존재 여부를 먼저 확인하고 step을 구성한다.)
 */
export function useOnboardingTour() {
  const navigate = useNavigate();
  const location = useLocation();

  const buildSteps = useCallback((): DriveStep[] => {
    const exists = (selector: string) => !!document.querySelector(selector);

    const aiSummaryStep: DriveStep = exists('[data-tour="ai-summary"]')
      ? {
          element: '[data-tour="ai-summary"]',
          popover: {
            title: '골라서 한 입에, AI 요약',
            description: '요약하고 싶은 메시지 구간을 선택하면 AI가 알맹이만 쏙 골라 회의록처럼 정리해줘요.',
            side: 'top',
            align: 'end',
          },
        }
      : {
          popover: {
            title: '골라서 한 입에, AI 요약',
            description:
              '채팅방을 열면 입력창 옆에 반짝이는 아이콘이 생겨요. 요약하고 싶은 메시지 구간만 콕 선택하면 AI가 알맹이만 골라 정리해줘요.',
          },
        };

    const docCollabStep: DriveStep = exists('[data-tour="doc-collaborators"]')
      ? {
          element: '[data-tour="doc-collaborators"]',
          popover: {
            title: '다 같이 뭉근하게, 동시 편집',
            description: '지금 이 문서를 같이 보고 있는 동료들이에요. 여러 명이 동시에 입력해도 실시간으로 반영돼요.',
            side: 'bottom',
            align: 'end',
          },
        }
      : {
          popover: {
            title: '다 같이 뭉근하게, 동시 편집',
            description:
              '문서 탭에 들어가면 지금 같이 보고 있는 동료들이 아바타로 떠요. 여러 명이 동시에 타이핑해도 실시간으로 뭉근하게 반영돼요.',
          },
        };

    return [
      {
        element: '[data-tour="new-chat"]',
        popover: {
          title: '친구를 콕 골라볼까요?',
          description: '뜨끈한 감자 고르듯, 대화하고 싶은 친구를 콕 선택하면 다이렉트든 그룹이든 바로 시작돼요.',
          side: 'bottom',
          align: 'start',
        },
      },
      aiSummaryStep,
      docCollabStep,
      {
        element: '[data-tour="search"]',
        popover: {
          title: '뭐든 후딱 찾기',
          description: '사람, 채팅방, 메시지, 문서까지 검색 한 번이면 콕 집어 찾아드려요.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="nav-notifications"]',
        popover: {
          title: '놓치면 아쉬운 소식',
          description: '멘션이나 초대 같은 새 소식이 오면 여기 폭신하게 쌓여요.',
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '[data-tour="nav-docs"]',
        popover: {
          title: '문서는 이쪽으로',
          description: '방금 본 동시 편집 문서들은 여기 문서 탭에 모여 있어요.',
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '[data-tour="help"]',
        popover: {
          title: '다시 보고 싶다면 여기',
          description: '이 버튼을 누르면 온보딩 가이드를 언제든 따끈하게 다시 볼 수 있어요.',
          side: 'bottom',
          align: 'end',
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
        allowClose: true,
        overlayOpacity: 0.5,
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
