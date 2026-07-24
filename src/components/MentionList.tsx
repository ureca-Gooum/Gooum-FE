import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { RoomMember } from '@/types/room';

interface MentionListProps {
  items: RoomMember[];
  command: (attrs: { id: string; label: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command({ id: item.userId, label: item.name });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) return false;
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-default px-3 py-2 text-xs text-fg-tertiary shadow-md">
        일치하는 멤버가 없어요
      </div>
    );
  }

  return (
    <div className="max-h-56 w-48 overflow-y-auto rounded-lg border border-border-default bg-bg-default py-1 shadow-md">
      {items.map((item, index) => (
        <button
          key={item.userId}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => selectItem(index)}
          className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors ${
            index === selectedIndex ? 'bg-bg-subtle text-fg-primary' : 'text-fg-secondary'
          }`}>
          <span className="truncate">{item.name}</span>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';
