import { useEffect, useMemo, useState } from 'react';
import { X, Search, Check, MessageCircle, Users } from 'lucide-react';
import { createRoom } from '@/api/rooms';
import type { RoomApiResponse, RoomType } from '@/types/room';
import { fetchUsers, type UserApiResponse } from '@/api/users';
import { Avatar } from '@/components/Avatar';
import { Skeleton } from '@/components/Skeleton';

interface NewChatModalProps {
  onClose: () => void;
  onCreated: (room: RoomApiResponse) => void;
}

export function NewChatModal({ onClose, onCreated }: NewChatModalProps) {
  const [roomType, setRoomType] = useState<RoomType>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserApiResponse[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setIsLoadingUsers(false));
  }, []);

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      if (roomType === 'direct') {
        return prev.includes(userId) ? [] : [userId];
      }
      return prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId];
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const room = await createRoom({
        type: roomType,
        name: roomType === 'group' ? groupName : undefined,
        memberIds: selectedIds,
      });
      onCreated(room);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, query]);

  const selectedUsers = useMemo(() => users.filter((u) => selectedIds.includes(u.userId)), [users, selectedIds]);

  const isValid = roomType === 'direct' ? selectedIds.length === 1 : selectedIds.length >= 2;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-[420px] flex-col overflow-hidden rounded-2xl bg-bg-default shadow-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5">
          <h3 className="text-base font-semibold text-fg-primary">새 채팅 시작</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-fg-tertiary transition-colors hover:bg-bg-subtle hover:text-fg-primary">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 pt-4">
          {/* 대화 유형 선택 (알약형 세그먼트 컨트롤) */}
          <div className="flex gap-1 rounded-full bg-bg-subtle p-1">
            <button
              onClick={() => {
                setRoomType('direct');
                setSelectedIds([]);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors ${
                roomType === 'direct'
                  ? 'bg-bg-default text-brand-primary shadow-sm'
                  : 'text-fg-tertiary hover:text-fg-secondary'
              }`}>
              <MessageCircle size={14} />
              1:1 대화
            </button>
            <button
              onClick={() => {
                setRoomType('group');
                setSelectedIds([]);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors ${
                roomType === 'group'
                  ? 'bg-bg-default text-brand-primary shadow-sm'
                  : 'text-fg-tertiary hover:text-fg-secondary'
              }`}>
              <Users size={14} />
              그룹 채팅
            </button>
          </div>

          {roomType === 'group' && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="그룹 이름"
              className="w-full rounded-lg border border-border-default px-3 py-2 text-sm text-fg-primary outline-none placeholder:text-fg-tertiary focus:border-brand-primary"
            />
          )}

          {/* 그룹 채팅에서 선택된 사람들: 지울 수 있는 칩으로 보여주기 */}
          {roomType === 'group' && selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedUsers.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => toggleUser(user.userId)}
                  className="flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-1 pr-2 text-xs font-medium text-brand-primary transition-colors hover:bg-brand-soft/70">
                  <Avatar
                    seed={user.userId}
                    imageUrl={user.profileImageUrl}
                    alt={user.name}
                    size={18}
                    showPresence={false}
                  />
                  {user.name}
                  <X size={12} />
                </button>
              ))}
            </div>
          )}

          {/* 검색 */}
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름으로 찾기"
              className="w-full rounded-lg border border-border-default bg-bg-canvas py-2 pl-9 pr-3 text-sm text-fg-primary outline-none placeholder:text-fg-tertiary focus:border-brand-primary focus:bg-bg-default"
            />
          </div>
        </div>

        {/* 유저 목록 */}
        <div className="mt-3 flex-1 overflow-y-auto px-2 pb-2">
          {isLoadingUsers ? (
            <div className="flex flex-col gap-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-fg-tertiary">
              {query ? '일치하는 사람이 없어요.' : '표시할 사람이 없어요.'}
            </p>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedIds.includes(user.userId);
              return (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => toggleUser(user.userId)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                    isSelected ? 'bg-brand-soft' : 'hover:bg-bg-subtle'
                  }`}>
                  <Avatar seed={user.userId} imageUrl={user.profileImageUrl} alt={user.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg-primary">{user.name}</p>
                    {user.statusMessage && <p className="truncate text-xs text-fg-tertiary">{user.statusMessage}</p>}
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-border-default'
                    }`}>
                    {isSelected && <Check size={12} />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center gap-3 border-t border-border-default px-5 py-4">
          <p className="text-xs text-fg-tertiary">
            {roomType === 'group' ? `${selectedIds.length}명 선택됨 (최소 2명)` : '한 명을 선택해주세요'}
          </p>
          {error && <p className="text-xs text-error">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="ml-auto rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {isLoading ? '생성 중...' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  );
}
