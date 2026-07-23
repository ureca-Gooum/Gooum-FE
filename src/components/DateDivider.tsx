export function DateDivider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center justify-center py-4">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-border-default" />
      </div>
      <div className="relative flex justify-center">
        <span className="rounded-full bg-bg-canvas border border-border-default px-4 py-1 text-xs text-fg-secondary">
          {label}
        </span>
      </div>
    </div>
  );
}
