export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background p-3 text-foreground sm:p-5 lg:p-8"
      role="status"
      aria-live="polite"
      aria-label="Đang mở đề thi"
    >
      <span className="sr-only">Đang mở đề thi</span>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="h-20 animate-pulse rounded-xl border border-border bg-card motion-reduce:animate-none" />
        <div className="h-14 animate-pulse rounded-xl border border-border bg-card motion-reduce:animate-none" />
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-52 animate-pulse rounded-xl border border-border bg-card motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
