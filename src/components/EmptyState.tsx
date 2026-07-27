import frame1 from '@/assets/loading/frame1_top.png';

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className || 'flex-1 h-full w-full min-h-[300px]'}`}>
      <img src={frame1} alt="" className="w-20 h-20 object-contain opacity-80" />
      <p className="text-sm font-semibold text-fg-tertiary">{title}</p>
      {description && <p className="text-xs text-fg-quaternary">{description}</p>}
    </div>
  );
}
