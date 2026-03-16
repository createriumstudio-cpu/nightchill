export default function ResultsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 pt-28 pb-16">
        {/* Title skeleton */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-6 w-16 rounded-full bg-muted/20 animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-muted/20 animate-pulse" />
          </div>
          <div className="mx-auto h-10 w-3/4 rounded-lg bg-muted/20 animate-pulse" />
          <div className="mx-auto mt-3 h-5 w-2/3 rounded-lg bg-muted/20 animate-pulse" />
        </div>

        {/* Timeline skeleton */}
        <div className="mt-12 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-muted/20 animate-pulse" />
              </div>
              <div className="flex-1 space-y-2 pb-6">
                <div className="h-5 w-1/2 rounded bg-muted/20 animate-pulse" />
                <div className="h-4 w-1/3 rounded bg-muted/20 animate-pulse" />
                <div className="h-48 w-full rounded-2xl bg-muted/10 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
