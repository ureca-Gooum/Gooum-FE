// src/components/layout/Sidebar.tsx
import { Bell, MessageCircle, FileText } from 'lucide-react';

const navItems = [
  { icon: Bell, label: '알림' },
  { icon: MessageCircle, label: 'DM' },
  { icon: FileText, label: '문서' },
];

export function Sidebar() {
  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-4 bg-bg-canvas pt-4">
      {navItems.map(({ icon: Icon, label }) => (
        <button
          key={label}
          className="flex w-full flex-col items-center gap-1 rounded-lg py-2 text-fg-tertiary hover:bg-bg-subtle hover:text-brand-primary">
          <Icon size={20} />
          <span className="text-[11px]">{label}</span>
        </button>
      ))}
    </aside>
  );
}
