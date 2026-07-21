import type { ReactNode } from 'react';

interface ListPanelProps {
  header: ReactNode;
  children: ReactNode;
}

export function ListPanel({ header, children }: ListPanelProps) {
  return (
    <section className="flex w-[320px] min-w-[280px] shrink-0 flex-col  bg-bg-canvas">
      <div className="border-b border-border-default p-4">{header}</div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}
