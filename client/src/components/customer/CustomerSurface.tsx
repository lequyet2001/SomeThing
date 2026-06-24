import clsx from 'clsx'
import type { ReactNode } from 'react'

export const customerShellClass = 'grid gap-8'

export const customerPanelClass = 'rounded-md border border-lineStrong/60 bg-white/95 p-5 shadow-liquid ring-1 ring-white/80 md:p-6'

export const customerSoftPanelClass = 'rounded-md border border-line bg-gradient-to-br from-white via-sky-50 to-rose-50 p-5 shadow-liquid ring-1 ring-white/80 md:p-6'

export const customerCardClass = 'rounded-md border border-lineStrong/50 bg-white p-4 shadow-liquid ring-1 ring-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-liquidHover'

export const customerProductCardClass = 'product-card group grid min-w-0 gap-3 rounded-md border border-lineStrong/60 bg-white p-3 shadow-liquid ring-1 ring-white/80 transition duration-200 ease-out hover:-translate-y-1  hover:border-primary/40 hover:shadow-liquidHover'

export const customerPrimaryButtonClass = 'inline-flex min-h-11 transform-gpu items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:shadow-panel hover:text-white  active:translate-y-0 active:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50'
// export const customerPrimaryButtonClass = 'inline-flex min-h-11 transform-gpu items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:shadow-panel hover:text-white  active:translate-y-0 active:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50'

export const customerSecondaryButtonClass = 'inline-flex min-h-11 transform-gpu items-center justify-center gap-2 rounded-md border border-lineStrong/70 bg-white px-4 py-2.5 text-sm font-extrabold text-primaryDark shadow-soft transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary hover:bg-sky-50 hover:shadow-panel active:translate-y-0 active:shadow-soft disabled:cursor-not-allowed  disabled:opacity-50'

export const customerDangerButtonClass = 'inline-flex min-h-11  transform-gpu items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-extrabold text-red-700 shadow-soft transition duration-200 ease-out hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-100 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50'

export const customerPillClass = 'inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primaryDark'

export const customerMutedPillClass = 'inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surfaceMuted px-3 py-1 text-xs font-black text-primaryDark'

export const customerInputGroupClass = 'grid gap-2 rounded-md border border-lineStrong/50 bg-white p-3 shadow-soft'

function renderOptionalText(text: ReactNode) {
  if (!text) return null
  return <p className="max-w-3xl text-base font-semibold leading-7 text-muted">{text}</p>
}

export function CustomerHero({
  actions,
  className,
  description,
  eyebrow,
  title,
  visual,
}: {
  actions?: ReactNode
  className?: string
  description?: ReactNode
  eyebrow?: ReactNode
  title: ReactNode
  visual?: ReactNode
}) {
  return (
    <section className={clsx('relative overflow-hidden rounded-md border border-lineStrong/60 bg-gradient-to-br from-white via-sky-50 to-rose-50 p-5 shadow-liquid ring-1 ring-white/80 md:p-8', className)}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-emerald-400" aria-hidden="true" />
      <div className={clsx('relative grid gap-6', visual ? 'lg:grid-cols-[1fr_360px] lg:items-center' : '')}>
        <div className="grid gap-4">
          {eyebrow ? <p className={customerPillClass}>{eyebrow}</p> : null}
          <h1 className="max-w-4xl text-3xl font-black leading-tight text-ink md:text-5xl">{title}</h1>
          {renderOptionalText(description)}
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
        {visual ? <div className="min-w-0">{visual}</div> : null}
      </div>
    </section>
  )
}

export function CustomerSectionHeader({
  className,
  description,
  eyebrow,
  meta,
  title,
}: {
  className?: string
  description?: ReactNode
  eyebrow?: ReactNode
  meta?: ReactNode
  title: ReactNode
}) {
  return (
    <div className={clsx('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="grid gap-2">
        {eyebrow ? <p className={customerPillClass}>{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="max-w-3xl text-sm font-semibold leading-6 text-muted">{description}</p> : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  )
}

export function CustomerEmptyState({
  action,
  className,
  description,
  icon,
  title,
}: {
  action?: ReactNode
  className?: string
  description?: ReactNode
  icon?: ReactNode
  title: ReactNode
}) {
  return (
    <div className={clsx('grid place-items-center gap-3 rounded-md border border-dashed border-lineStrong bg-surfaceMuted p-7 text-center font-extrabold text-muted', className)}>
      {icon ? <span className="inline-flex size-12 items-center justify-center rounded-md border border-primary/20 bg-white text-primaryDark shadow-soft">{icon}</span> : null}
      <strong className="text-lg font-black text-ink">{title}</strong>
      {description ? <p className="max-w-xl text-sm font-semibold leading-6 text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
