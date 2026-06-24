import { SlidersHorizontal, X } from 'lucide-react'

import type { AdminFilterPanelProps } from '../../types/shop'

function AdminFilterPanel({ children, className = '', clearLabel, onClear, title }: AdminFilterPanelProps) {
  return (
    <section className={`grid gap-3 rounded-md border border-line bg-gradient-to-br from-white to-surfaceMuted p-3 shadow-soft ${className}`.trim()}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-2 font-black text-primaryDark">
          <span className="inline-flex size-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
            <SlidersHorizontal size={16} />
          </span>
          <strong>{title}</strong>
        </div>
        <button type="button" className="h-10 w-full border-line bg-white px-3 text-muted hover:text-primaryDark sm:w-auto" onClick={onClear}>
          <X size={15} />
          {clearLabel}
        </button>
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        {children}
      </div>
    </section>
  )
}

export default AdminFilterPanel
