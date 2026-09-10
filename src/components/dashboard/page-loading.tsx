export function PageLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Đang tải nội dung">
      <span className="sr-only">Đang tải nội dung</span>
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl border border-border bg-card motion-reduce:animate-none" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-border bg-card motion-reduce:animate-none" />
    </div>
  );
}
