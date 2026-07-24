import { createPortal } from 'react-dom';
import { MessageCircle } from 'lucide-react';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import { Avatar } from '@/components/Avatar';
import { useMyProfile } from '@/hooks/useMyProfile';
import { getCurrentUserId } from '@/constants/auth';
import type { RoomMember } from '@/types/room';
import type { PresenceStatus } from '@/types/chat';

const CARD_WIDTH = 240;
const VIEWPORT_MARGIN = 12;

const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  online: '대화 가능',
  away: '자리 비움',
  busy: '방해 금지',
  offline: '오프라인',
};

interface MentionHoverCardProps {
  userId: string;
  /** 호버 중인 멘션 span의 위치 (뷰포트 기준) */
  anchorRect: DOMRect;
  /** 방 멤버 목록에서 찾은 정보. 못 찾으면 이름/아바타 정도만 최소로 보여준다. */
  member?: RoomMember;
  onMouseEnterCard: () => void;
  onMouseLeaveCard: () => void;
  onStartDirectMessage?: (userId: string) => void;
}

export function MentionHoverCard({
  userId,
  anchorRect,
  member,
  onMouseEnterCard,
  onMouseLeaveCard,
  onStartDirectMessage,
}: MentionHoverCardProps) {
  const isSelf = getCurrentUserId() === userId;
  // 다른 사람 카드를 그릴 때는 "내 프로필" 조회 자체가 필요 없으니 enabled=false로 요청을 건너뛴다.
  const myProfile = useMyProfile(isSelf);

  const left = Math.min(Math.max(anchorRect.left, VIEWPORT_MARGIN), window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN);
  const top = anchorRect.bottom + 6;

  return createPortal(
    <div
      onMouseEnter={onMouseEnterCard}
      onMouseLeave={onMouseLeaveCard}
      style={{ position: 'fixed', top, left, zIndex: 60 }}>
      {isSelf ? (
        // 본인 멘션: 사이드바에서 보는 프로필창 그대로. 단, 로그아웃 버튼만 빠진다 (onLogout 미전달 시 자동으로 숨겨짐).
        <ProfileDropdown
          className="relative"
          isSelf
          userName={myProfile.userName}
          currentStatus={myProfile.status}
          userImage={myProfile.userImage}
          statusMessage={myProfile.statusMessage}
          onStatusChange={myProfile.onStatusChange}
          onStatusMessageChange={myProfile.onStatusMessageChange}
        />
      ) : (
        <div className="w-[240px] rounded-2xl border border-gray-100 bg-white p-4 text-gray-800 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <Avatar
              seed={member?.userId ?? userId}
              imageUrl={member?.profileImageUrl}
              presence={member?.presence?.status}
              size={44}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold leading-tight text-gray-900">{member?.name ?? '알 수 없음'}</span>
              {member?.presence?.status && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      member.presence.status === 'online'
                        ? 'bg-presence-online'
                        : member.presence.status === 'away'
                          ? 'bg-presence-away'
                          : member.presence.status === 'busy'
                            ? 'bg-presence-dnd'
                            : 'bg-presence-offline'
                    }`}
                  />
                  <span className="text-[12px] font-medium text-gray-600">
                    {PRESENCE_LABEL[member.presence.status]}
                  </span>
                </div>
              )}
            </div>
          </div>

          {member?.statusMessage && (
            <p className="mt-3 rounded-xl bg-gray-50 p-3 text-[13px] font-normal leading-snug text-gray-700">
              {member.statusMessage}
            </p>
          )}

          <button
            type="button"
            onClick={() => onStartDirectMessage?.(userId)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-primary py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90">
            <MessageCircle size={14} />
            메시지 보내기
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
