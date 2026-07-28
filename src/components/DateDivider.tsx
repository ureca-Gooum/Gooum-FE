export function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-2.5">
      <span className="rounded-full bg-bg-subtle px-3 py-1 text-[11px] font-semibold tracking-wide text-fg-tertiary">
        {label}
      </span>
    </div>
  );
}
