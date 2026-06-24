function SkeletonLine({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded-full bg-slate-200 ${className}`} aria-hidden="true" />
}

function SkeletonBox({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded-md bg-slate-200 ${className}`} aria-hidden="true" />
}

export function RoutePageSkeleton() {
  return (
    <section className="grid gap-6" aria-busy="true" aria-live="polite">
      <div className="grid overflow-hidden rounded-md border border-line bg-white p-6 shadow-liquid lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="grid content-center gap-4">
          <SkeletonLine className="h-4 w-36" />
          <SkeletonLine className="h-10 w-3/4 max-w-xl" />
          <SkeletonLine className="h-4 w-full max-w-2xl" />
          <SkeletonLine className="h-4 w-5/6 max-w-xl" />
          <div className="flex flex-wrap gap-3">
            <SkeletonBox className="h-11 w-32" />
            <SkeletonBox className="h-11 w-28" />
          </div>
        </div>
        <SkeletonBox className="min-h-72 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="grid gap-3 rounded-md border border-line bg-white p-4 shadow-liquid">
            <SkeletonBox className="aspect-[4/3] w-full" />
            <SkeletonLine className="h-4 w-24" />
            <SkeletonLine className="h-5 w-full" />
            <SkeletonLine className="h-5 w-2/3" />
          </article>
        ))}
      </div>
    </section>
  )
}

export function ProductPageSkeleton() {
  return (
    <section className="grid gap-8" aria-busy="true" aria-live="polite">
      <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-3">
          <SkeletonBox className="aspect-square w-full" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBox key={index} className="aspect-square w-full" />
            ))}
          </div>
        </div>
        <div className="grid content-start gap-4 rounded-md border border-line bg-white p-5 shadow-liquid">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-8 w-40" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-5/6" />
          <SkeletonBox className="h-11 w-36" />
          <div className="grid gap-3 rounded-md border border-line bg-surfaceMuted p-4">
            <SkeletonLine className="h-5 w-44" />
            <SkeletonBox className="h-28 w-full" />
          </div>
        </div>
      </section>
    </section>
  )
}

