import { Skeleton } from '@/components/Skeleton';

export function RoomListItemSkeleton() {
  return (
    <div className="mx-2 flex items-center gap-3 rounded-lg border border-transparent px-3 py-2">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-2 h-3.5 w-24" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-3 w-9 shrink-0" />
    </div>
  );
}
