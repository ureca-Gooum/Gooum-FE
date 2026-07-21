import { useState } from 'react';
import { Plus } from 'lucide-react';
import { createRoom } from '@/api/rooms';

export function NewChatButton({ onCreated }: { onCreated: (roomId: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 지금은 테스트용으로 특정 유저 ID 하드코딩
      // 나중에 유저 검색 UI 완성되면 선택한 유저 ID로 교체
      const room = await createRoom({
        type: 'direct',
        memberIds: ['665f1c2a3b4e5f6a7b8c9d0f'], // 임시 테스트 ID
      });
      onCreated(room.roomId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center gap-1 rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle disabled:opacity-50">
        <Plus size={18} />
      </button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
