import type { ReactNode } from 'react';

interface MainPanelProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function MainPanel({ header, children, footer }: MainPanelProps) {
  return (
    <section
      className="
        flex min-w-0 min-h-0 @md:min-w-[480px] flex-1 flex-col
        overflow-hidden rounded-lg
        bg-bg-default
      "
      style={{ boxShadow: '0 6px 18px -6px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06)' }}>
      <div className="shrink-0">{header}</div>
      <div 
        className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-4 overscroll-y-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>
      {footer && <div className="min-w-0 shrink-0 p-4">{footer}</div>}
    </section>
  );
}
