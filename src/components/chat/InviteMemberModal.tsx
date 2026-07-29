import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check } from 'lucide-react';
import { inviteRoomMembers } from '@/api/rooms';
import { fetchUsers, type UserApiResponse } from '@/api/users';
import { Avatar } from '@/components/Avatar';
import { Skeleton } from '@/components/Skeleton';
import type { RoomMember } from '@/types/room';

interface InviteMemberModalProps {
  roomId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onInvited: (addedMembers: RoomMember[]) => void;
  usePortal?: boolean;
}

export function InviteMemberModal({ roomId, existingMemberIds, onClose, onInvited, usePortal = true }: InviteMemberModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserApiResponse[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setIsLoadingUsers(false));
  }, []);

  const inviteCandidates = useMemo(
    () => users.filter((u) => !existingMemberIds.includes(u.userId)),
    [users, existingMemberIds]
  );

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await inviteRoomMembers(roomId, selectedIds);
      const addedMembers: RoomMember[] = selectedUsers.map((u) => ({
        userId: u.userId,
        name: u.name,
        profileImageUrl: u.profileImageUrl,
        presence: u.presence,
        statusMessage: u.statusMessage ?? undefined,
      }));
      onInvited(addedMembers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inviteCandidates;
    return inviteCandidates.filter((u) => u.name.toLowerCase().includes(q));
  }, [inviteCandidates, query]);

  const selectedUsers = useMemo(
    () => inviteCandidates.filter((u) => selectedIds.includes(u.userId)),
    [inviteCandidates, selectedIds]
  );

  const content = (
    <div
      onClick={onClose}
      className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-[420px] flex-col overflow-hidden rounded-2xl bg-bg-default shadow-lg">
        <div className="flex items-center justify-between px-5 pt-5">
          <h3 className="text-base font-semibold text-fg-primary">멤버 초대</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-fg-tertiary transition-colors hover:bg-bg-subtle hover:text-fg-primary">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 pt-4">
          {selectedUsers.length > 0 && (
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

        <div className="mt-3 flex-1 overflow-y-auto px-2 pb-2">
          {isLoadingUsers ? (
            <div className="flex flex-col gap-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-fg-tertiary">
              {query ? '일치하는 사람이 없어요.' : '초대할 수 있는 사람이 없어요.'}
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

        <div className="flex items-center gap-3 border-t border-border-default px-5 py-4">
          <p className="text-xs text-fg-tertiary">{selectedIds.length}명 선택됨</p>
          {error && <p className="text-xs text-error">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || isSubmitting}
            className="ml-auto rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {isSubmitting ? '초대 중...' : '초대하기'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!usePortal) {
    return content;
  }

  return createPortal(
    content,
    document.getElementById('modal-root') || document.body
  );
}
