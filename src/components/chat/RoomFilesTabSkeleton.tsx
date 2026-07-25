import { Skeleton } from '@/components/Skeleton';

export function RoomFilesTabSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      {/* 필터 알약 버튼 자리 */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-7 w-12 rounded-full" />
        <Skeleton className="h-7 w-12 rounded-full" />
        <Skeleton className="h-7 w-14 rounded-full" />
      </div>

      {/* 이미지 썸네일 자리 */}
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3 w-16 rounded-full" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-[88px] shrink-0 rounded-lg" />
          ))}
        </div>
      </div>

      {/* 파일 리스트 자리 */}
      <div className="flex flex-col gap-1">
        <Skeleton className="mb-1 h-3 w-10 rounded-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-1.5 py-2.5">
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <Skeleton className="mb-2 h-3.5 w-36 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
