import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { updateRoomName } from '@/api/rooms';

interface RenameRoomModalProps {
  roomId: string;
  currentName: string;
  onClose: () => void;
  onRenamed: (newName: string) => void;
}

export function RenameRoomModal({ roomId, currentName, onClose, onRenamed }: RenameRoomModalProps) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('채팅방 이름을 입력해주세요.');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await updateRoomName(roomId, trimmedName);
      onRenamed(trimmedName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="absolute inset-0 z-[50] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 pointer-events-auto rounded-none @md:rounded-r-2xl"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-bg-default p-6 shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between border-b border-border-default pb-4 mb-4">
          <h2 className="text-xl font-bold text-fg-primary">채팅방 이름 변경</h2>
          <button onClick={onClose} className="rounded-full p-2 text-fg-tertiary hover:bg-bg-subtle hover:text-fg-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-fg-secondary mb-1">
              새로운 이름
            </label>
            <input
              id="roomName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="채팅방 이름을 입력하세요"
              autoFocus
              maxLength={30}
              className="w-full rounded-xl border border-border-default bg-bg-canvas px-4 py-3 text-[15px] text-fg-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-fg-secondary hover:bg-bg-subtle transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-secondary disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
