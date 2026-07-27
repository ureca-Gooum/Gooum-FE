import { Skeleton } from '@/components/Skeleton';

export function DocsEditorSkeleton() {
  const widths = ['45%', '90%', '80%', '65%'];

  return (
    <div className="flex w-full flex-col gap-3 py-2">
      {widths.map((width, i) => (
        <Skeleton key={i} className="h-3.5 rounded-full" style={{ width }} />
      ))}
    </div>
  );
}
