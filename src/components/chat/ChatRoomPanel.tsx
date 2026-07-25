import { useRef, useState, type ReactNode, type RefObject } from 'react';
import { Heart, Pencil, Bell, BellOff } from 'lucide-react';
import { MainPanel } from '@/components/layout/MainPanel';
import { Avatar } from '@/components/Avatar';
import { ChatMessageInput } from '@/components/ChatMessageInput';
import { ChatDateDivider } from '@/components/ChatDateDivider';
import { MessageBubble } from '@/components/MessageBubble';
import { MentionHoverCard } from '@/components/MentionHoverCard';
import { MessageAreaSkeleton } from '@/components/MessageAreaSkeleton';
import type { Message, PresenceStatus, TiptapDoc } from '@/types/chat';
import type { RoomMember } from '@/types/room';

function getDateLabel(time: string) {
  return time.split(',')[0];
}

/** 같은 발신자가 짧은 시간 안에 연속으로 보낸 메시지인지 판정 (아바타를 한 번만 보여줄지 결정) */
const GROUP_THRESHOLD_MS = 3 * 60 * 1000; // 3분

function isSameMessageGroup(prev: Message | undefined, curr: Message): boolean {
  if (!prev) return false;
  if (prev.senderId !== curr.senderId) return false;
  if (prev.isMine !== curr.isMine) return false;

  if (prev.createdAt && curr.createdAt) {
    const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return diff >= 0 && diff <= GROUP_THRESHOLD_MS;
  }

  // createdAt이 없는 경우(더미 데이터 등)엔 같은 시간 라벨일 때만 묶는다
  return prev.time === curr.time;
}

export interface ChatRoomPanelTab {
  key: string;
  label: string;
}

/** 헤더에 표시할 대상(채팅방 또는 알림 상대) 정보 - Room 전체가 아니라 필요한 값만 받는다 */
export interface ChatRoomPanelTarget {
  id: string;
  displayName: string;
  displayImage: string | null;
  presence?: PresenceStatus;
  isGroup?: boolean;
  isFavorite?: boolean;
  /** 1:1 채팅 상대의 userId. 헤더 프로필을 호버했을 때 프로필 카드를 띄우는 데 쓰인다. 그룹방이면 없어도 된다. */
  userId?: string | null;
  /** 그룹방 인원수. 그룹방 헤더 아바타는 이미지 대신 이 숫자 뱃지로 표시한다. */
  memberCount?: number;
}

interface ChatRoomPanelProps {
  target: ChatRoomPanelTarget | null;
  emptyHeaderLabel?: string;

  tabs: ChatRoomPanelTab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  /** tabs 중 "채팅" 목록을 렌더링할 탭의 key. 기본값 'chat' */
  chatTabKey?: string;
  /** activeTab이 채팅 탭이 아닐 때(파일/문서/AI회의록 등) 보여줄 내용. 페이지마다 문구가 다를 수 있어 위임한다 */
  renderOtherTab?: (tabKey: string) => ReactNode;

  isMuted?: boolean;
  onToggleMute?: () => void;
  onToggleFavorite?: () => void;
  onRenameGroup?: () => void;

  messages: Message[];
  isMessagesLoading: boolean;
  roomMembers: RoomMember[];
  /** "@" 멘션 자동완성에 띄울 전체 가입자 목록. 넘기지 않으면 roomMembers(현재 방 멤버)만 뜬다. */
  mentionCandidates?: RoomMember[];
  messagesEndRef: RefObject<HTMLDivElement>;

  isSelectingMessages: boolean;
  selectedMessageIds: string[];
  onToggleMessageSelect: (messageId: string) => void;
  onStartSelecting: () => void;
  onCancelSelecting: () => void;
  onResetSelection: () => void;
  onConfirmSelection: () => void;

  typingLabel?: string;
  onSend: (content: TiptapDoc) => void;
  onSendFile: (payload: { type: 'image' | 'file'; fileUrl: string; fileName: string }) => void;
  onTyping: () => void;
  onOpenAiMinutes: () => void;
  onCreateDocument: (payload: { title: string; content: TiptapDoc; isContentEmpty: boolean }) => void;
  onDeleteMessage: (messageId: string) => void;
  onStartDirectMessage?: (userId: string) => void;
}

/**
 * 채팅 메인패널: 상단 헤더(아바타/이름/탭/알림·즐겨찾기) + 메시지 목록 + 하단 입력창.
 * ChatPage(채팅 탭)와 NotificationsPage(알림 상세)가 동일하게 사용하도록 프레젠테이셔널로 분리했다.
 * 실제 데이터/소켓/전송 로직은 `useRoomConversation` 훅에서 가져와 그대로 props로 내려주면 된다.
 */
export function ChatRoomPanel({
  target,
  emptyHeaderLabel = '채팅방을 선택해주세요',
  tabs,
  activeTab,
  onTabChange,
  chatTabKey = 'chat',
  renderOtherTab,
  isMuted = false,
  onToggleMute,
  onToggleFavorite,
  onRenameGroup,
  messages,
  isMessagesLoading,
  roomMembers,
  mentionCandidates,
  messagesEndRef,
  isSelectingMessages,
  selectedMessageIds,
  onToggleMessageSelect,
  onCancelSelecting,
  onResetSelection,
  onConfirmSelection,
  typingLabel,
  onSend,
  onSendFile,
  onTyping,
  onOpenAiMinutes,
  onCreateDocument,
  onDeleteMessage,
  onStartDirectMessage,
}: ChatRoomPanelProps) {
  const isChatTab = activeTab === chatTabKey;

  // 헤더의 상대 프로필(아바타+이름)에 호버했을 때 보여줄 프로필 카드 상태
  const [isHeaderProfileHovered, setIsHeaderProfileHovered] = useState(false);
  const [headerProfileRect, setHeaderProfileRect] = useState<DOMRect | null>(null);
  const headerProfileHideTimeoutRef = useRef<number>();

  const clearHeaderProfileHideTimeout = () => {
    if (headerProfileHideTimeoutRef.current) {
      window.clearTimeout(headerProfileHideTimeoutRef.current);
      headerProfileHideTimeoutRef.current = undefined;
    }
  };

  const scheduleHideHeaderProfile = () => {
    clearHeaderProfileHideTimeout();
    headerProfileHideTimeoutRef.current = window.setTimeout(() => setIsHeaderProfileHovered(false), 150);
  };

  // 그룹방은 상대가 여러 명이라 헤더 프로필 카드 대상이 아니다. 1:1일 때만, userId가 있을 때만 호버 카드를 띄운다.
  const headerProfileMember: RoomMember | undefined =
    !target?.isGroup && target?.userId
      ? (mentionCandidates?.find((m) => m.userId === target.userId) ??
        roomMembers.find((m) => m.userId === target.userId) ?? {
          userId: target.userId,
          name: target.displayName,
          profileImageUrl: target.displayImage,
          presence: target.presence ? { status: target.presence } : undefined,
        })
      : undefined;

  return (
    <MainPanel
      header={
        target ? (
          <div className="flex h-[63px] items-center gap-3 border-b border-border-default px-4">
            <div
              className={`flex items-center gap-3 ${headerProfileMember ? 'cursor-pointer' : ''}`}
              onMouseEnter={(e) => {
                if (!headerProfileMember) return;
                clearHeaderProfileHideTimeout();
                setHeaderProfileRect(e.currentTarget.getBoundingClientRect());
                setIsHeaderProfileHovered(true);
              }}
              onMouseLeave={() => {
                if (!headerProfileMember) return;
                scheduleHideHeaderProfile();
              }}>
              <Avatar
                seed={target.id}
                imageUrl={target.isGroup ? undefined : target.displayImage}
                presence={target.isGroup ? undefined : target.presence}
                memberCount={target.isGroup ? target.memberCount : undefined}
                alt={target.displayName}
                size={28}
              />

              <h2 className="shrink-0 font-semibold text-fg-primary">{target.displayName}</h2>
            </div>

            {isHeaderProfileHovered && headerProfileMember && headerProfileRect && (
              <MentionHoverCard
                userId={headerProfileMember.userId}
                anchorRect={headerProfileRect}
                member={headerProfileMember}
                onMouseEnterCard={clearHeaderProfileHideTimeout}
                onMouseLeaveCard={scheduleHideHeaderProfile}
                onStartDirectMessage={onStartDirectMessage}
              />
            )}

            {target.isGroup && onRenameGroup && (
              <button onClick={onRenameGroup} className="shrink-0 text-fg-tertiary hover:text-brand-primary">
                <Pencil size={16} />
              </button>
            )}

            <div className="flex items-center gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`relative text-sm ${
                    activeTab === tab.key ? 'font-medium text-brand-primary' : 'text-fg-tertiary'
                  }`}>
                  {tab.label}
                  {activeTab === tab.key && (
                    <span
                      className="absolute left-0 right-0 bg-brand-primary"
                      style={{ bottom: '-17px', height: '2px' }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {target.isGroup && roomMembers.length > 0 && (
                <div className="flex shrink-0 items-center -space-x-2">
                  {roomMembers.slice(0, 5).map((member) => (
                    <div key={member.userId} className="rounded-full border-[3px] border-bg-default shadow-sm">
                      <Avatar
                        seed={member.userId}
                        imageUrl={member.profileImageUrl}
                        alt={member.name}
                        size={24}
                        showPresence={false}
                      />
                    </div>
                  ))}
                  {roomMembers.length > 5 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-bg-default bg-bg-subtle text-[10px] font-medium text-fg-tertiary shadow-sm">
                      +{roomMembers.length - 5}
                    </div>
                  )}
                </div>
              )}

              {onToggleMute && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  title={isMuted ? '채팅방 알림 켜기' : '채팅방 알림 끄기'}
                  aria-label={isMuted ? '채팅방 알림 켜기' : '채팅방 알림 끄기'}
                  aria-pressed={!isMuted}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-fg-tertiary transition-colors hover:bg-bg-subtle hover:text-brand-primary">
                  {isMuted ? (
                    <BellOff size={18} />
                  ) : (
                    <Bell size={18} fill="currentColor" className="text-brand-primary" />
                  )}
                </button>
              )}

              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  title={target.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                  aria-label={target.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-fg-tertiary transition-colors hover:bg-bg-subtle hover:text-brand-primary">
                  <Heart
                    size={18}
                    fill={target.isFavorite ? 'currentColor' : 'none'}
                    className={target.isFavorite ? 'text-brand-primary' : 'text-fg-tertiary'}
                  />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-[63px] items-center border-b border-border-default px-4">
            <h2 className="text-fg-tertiary">{emptyHeaderLabel}</h2>
          </div>
        )
      }
      footer={
        target && isChatTab ? (
          <div className="mx-auto w-full max-w-6xl">
            {isSelectingMessages ? (
              <div className="flex items-center justify-between rounded-lg bg-bg-subtle px-3 py-2.5">
                <span className="text-sm text-fg-primary">
                  {selectedMessageIds.length > 0
                    ? `${selectedMessageIds.length}개 메시지 선택됨`
                    : '요약할 메시지의 시작점을 클릭해주세요'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onResetSelection}
                    disabled={selectedMessageIds.length === 0}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-fg-tertiary hover:bg-bg-canvas disabled:opacity-40">
                    초기화
                  </button>
                  <button
                    onClick={onCancelSelecting}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-fg-tertiary hover:bg-bg-canvas">
                    취소
                  </button>
                  <button
                    onClick={onConfirmSelection}
                    disabled={selectedMessageIds.length === 0}
                    className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
                    다음
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {typingLabel && <p className="px-1 text-xs text-fg-tertiary">{typingLabel}</p>}
                <ChatMessageInput
                  onSend={onSend}
                  onSendFile={onSendFile}
                  onTyping={onTyping}
                  onOpenAiMinutes={onOpenAiMinutes}
                  onCreateDocument={onCreateDocument}
                  roomMembers={roomMembers}
                  mentionCandidates={mentionCandidates}
                />
              </div>
            )}
          </div>
        ) : undefined
      }>
      {isChatTab ? (
        isMessagesLoading ? (
          <MessageAreaSkeleton />
        ) : (
          <div className="mx-auto flex min-w-0 w-full max-w-6xl flex-col gap-3">
            {isSelectingMessages && (
              <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand-primary">
                메시지를 클릭해 요약할 범위를 선택해주세요. 시작점을 누르고, 끝점을 누르면 그 사이가 전부 선택돼요.
              </p>
            )}
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              const showDateDivider = !prevMsg || getDateLabel(prevMsg.time) !== getDateLabel(msg.time);
              const showAvatar = showDateDivider || !isSameMessageGroup(prevMsg, msg);

              return (
                <div key={msg.id} className="w-full min-w-0">
                  {showDateDivider && <ChatDateDivider label={getDateLabel(msg.time)} />}
                  <MessageBubble
                    message={msg}
                    onDelete={onDeleteMessage}
                    selectable={isSelectingMessages}
                    isSelected={selectedMessageIds.includes(msg.id)}
                    onToggleSelect={onToggleMessageSelect}
                    roomMembers={roomMembers}
                    mentionCandidates={mentionCandidates}
                    onStartDirectMessage={onStartDirectMessage}
                    showAvatar={showAvatar}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )
      ) : (
        renderOtherTab?.(activeTab)
      )}
    </MainPanel>
  );
}
