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
      className={`rounded-xl border p-3 flex items-start gap-3 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-brand-primary bg-bg-subtle"
          : notification.isRead
            ? "border-transparent bg-transparent hover:bg-bg-subtle opacity-60"
            : "border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary/10 shadow-sm"
      }`}
    >
      <div className="shrink-0 pt-0.5 relative">
        {!notification.isRead && (
          <span className="absolute -top-1 -left-1 z-10 h-3 w-3 rounded-full bg-brand-primary ring-2 ring-bg-canvas" />
        )}
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
          <span className={`text-sm truncate ${notification.isRead ? 'text-fg-secondary font-medium' : 'text-fg-primary font-bold'}`}>
            {notification.title}
          </span>
          <span className="text-xs text-fg-tertiary shrink-0">
            {notification.time}
          </span>
        </div>
        <p className={`text-[13px] leading-snug line-clamp-2 ${notification.isRead ? 'text-fg-tertiary' : 'text-fg-secondary'}`}>
          {notification.content}
        </p>
      </div>
    </div>
  );
}
