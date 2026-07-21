import type { ReactNode } from 'react';

interface MainPanelProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function MainPanel({ header, children, footer }: MainPanelProps) {
  return (
    <section className="flex flex-1 flex-col rounded-lg bg-bg-default shadow-md overflow-hidden">
      <div className="border-b border-border-default px-6 py-4">{header}</div>
      <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      {footer && <div className="border-t border-border-default p-4">{footer}</div>}
    </section>
  );
}
