// 1. 상태 타입
export type UserStatus = '대화 가능' | '자리 비움' | '방해 금지' | '오프라인';

// 2. 상태별 라벨 및 색상 관리
export const USER_STATUS_CONFIG: Record<UserStatus, { label: UserStatus; color: string }> = {
  '대화 가능': { label: '대화 가능', color: 'bg-presence-online' },
  '자리 비움': { label: '자리 비움', color: 'bg-presence-away' },
  '방해 금지': { label: '방해 금지', color: 'bg-presence-dnd' },
  오프라인: {
    label: '오프라인',
    color: 'border border-presence-offline-border bg-presence-offline',
  },
};
