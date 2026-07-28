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
        flex min-w-0 @md:min-w-[480px] flex-1 flex-col
        overflow-hidden rounded-lg
        bg-bg-default
      "
      style={{ boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.22), 0 2px 8px rgba(15, 23, 42, 0.08)' }}>
      <div className="shrink-0">{header}</div>

      <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-4">{children}</div>

      {footer && <div className="min-w-0 shrink-0 p-4">{footer}</div>}
    </section>
  );
}
