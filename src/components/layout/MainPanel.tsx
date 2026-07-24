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
        flex min-w-[480px] flex-1 flex-col
        overflow-hidden rounded-lg
        bg-bg-default shadow-md
      ">
      <div className="shrink-0">{header}</div>

      <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-4">{children}</div>

      {footer && <div className="min-w-0 shrink-0 p-4">{footer}</div>}
    </section>
  );
}
