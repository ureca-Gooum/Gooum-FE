import { Avatar } from "@/components/Avatar";
import type { NotificationItem } from "@/types/notification";

interface NotificationListItemProps {
  notification: NotificationItem;
  onSelect: () => void;
  isSelected: boolean;
}

export function NotificationListItem({
  notification,
  onSelect,
  isSelected,
}: NotificationListItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border p-3 flex items-start gap-3 cursor-pointer transition-colors ${
        isSelected
          ? "border-brand-primary bg-bg-subtle"
          : "border-border-default bg-bg-canvas hover:bg-bg-subtle"
      }`}
    >
      <div className="shrink-0 pt-0.5">
        <Avatar
          seed={notification.id}
          imageUrl={notification.avatarUrl}
          presence="online"
          alt={notification.title}
          size={36}
        />
      </div>
      
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-fg-primary truncate">
            {notification.title}
          </span>
          <span className="text-xs text-fg-tertiary shrink-0">
            {notification.time}
          </span>
        </div>
        <p className="text-[13px] text-fg-secondary leading-snug line-clamp-2">
          {notification.content}
        </p>
      </div>
    </div>
  );
}
