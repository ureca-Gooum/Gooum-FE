import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createRoom } from '@/api/rooms';
import type { RoomApiResponse, RoomType } from '@/types/room';
import { fetchUsers, type UserApiResponse } from '@/api/users';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface NewChatModalProps {
  onClose: () => void;
  onCreated: (room: RoomApiResponse) => void;
}

export function NewChatModal({ onClose, onCreated }: NewChatModalProps) {
  const [roomType, setRoomType] = useState<RoomType>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  const isValid = roomType === 'direct' ? selectedIds.length === 1 : selectedIds.length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[400px] rounded-2xl bg-bg-default p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-fg-primary">새 채팅 시작</h3>
          <button onClick={onClose}>
            <X size={18} className="text-fg-tertiary" />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setRoomType('direct');
              setSelectedIds([]);
            }}
            className={`flex-1 rounded-lg py-2 text-sm ${
              roomType === 'direct' ? 'bg-brand-soft text-brand-primary' : 'bg-bg-subtle text-fg-tertiary'
            }`}>
            1:1 대화
          </button>
          <button
            onClick={() => {
              setRoomType('group');
              setSelectedIds([]);
            }}
            className={`flex-1 rounded-lg py-2 text-sm ${
              roomType === 'group' ? 'bg-brand-soft text-brand-primary' : 'bg-bg-subtle text-fg-tertiary'
            }`}>
            그룹 채팅
          </button>
        </div>

        {roomType === 'group' && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="그룹 이름"
            className="mb-3 w-full rounded-lg border border-border-default px-3 py-2 text-sm"
          />
        )}

        <div className="mb-4 max-h-60 overflow-y-auto rounded-lg border border-border-default">
          {isLoadingUsers ? (
            <LoadingSpinner message="유저 목록을 불러오는 중..." className="py-10" />
          ) : users.length === 0 ? (
            <p className="px-3 py-2 text-sm text-fg-tertiary">표시할 유저가 없어요.</p>
          ) : (
            users.map((user) => (
              <label key={user.userId} className="flex items-center gap-2 px-3 py-2 hover:bg-bg-subtle cursor-pointer">
                <input
                  type={roomType === 'direct' ? 'radio' : 'checkbox'}
                  checked={selectedIds.includes(user.userId)}
                  onChange={() => toggleUser(user.userId)}
                />
                <span className="text-sm text-fg-primary">{user.name}</span>
              </label>
            ))
          )}
        </div>

        {error && <p className="mb-2 text-xs text-error">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="w-full rounded-lg bg-brand-primary py-2 text-sm text-white disabled:opacity-40">
          {isLoading ? '생성 중...' : '만들기'}
        </button>
      </div>
    </div>
  );
}
