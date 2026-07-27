import { Skeleton } from '@/components/Skeleton';

export function MessageAreaSkeleton() {
  const rows: { isMine: boolean; width: number }[] = [
    { isMine: false, width: 140 },
    { isMine: false, width: 200 },
    { isMine: true, width: 100 },
    { isMine: false, width: 170 },
    { isMine: true, width: 150 },
    { isMine: true, width: 80 },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      {rows.map((row, i) => (
        <div key={i} className={`flex ${row.isMine ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className="h-3.5 rounded-full" style={{ width: row.width }} />
        </div>
      ))}
    </div>
  );
}
