import { Skeleton } from '@/components/Skeleton';

export function RoomDocumentsTabSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex w-full items-center gap-3 px-1.5 py-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-3.5 w-40 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}
