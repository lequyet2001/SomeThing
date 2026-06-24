import { LoaderCircle } from 'lucide-react'

interface AdminLoadingStateProps {
  compact?: boolean
  label: string
  rows?: number
}

function AdminLoadingState({ label, rows = 5, compact = false }: AdminLoadingStateProps) {
  return (
    <div className={compact ? 'grid gap-4' : 'grid gap-4 rounded-md border border-line bg-white p-4'} aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 font-black text-primaryDark">
        <LoaderCircle className="animate-spin" size={18} />
        <strong>{label}</strong>
      </div>
      <div className="grid gap-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-2 sm:grid-cols-4">
            <span className="h-4 animate-pulse rounded-full bg-slate-200" />
            <span className="h-4 animate-pulse rounded-full bg-slate-200" />
            <span className="h-4 animate-pulse rounded-full bg-slate-200" />
            <span className="h-4 animate-pulse rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminSectionLoading({ label, rows = 6 }: Omit<AdminLoadingStateProps, 'compact'>) {
  return (
    <section className="grid gap-4 rounded-md border border-line bg-white p-4 shadow-liquid">
      <AdminLoadingState label={label} rows={rows} />
    </section>
  )
}

export function AdminTableLoadingRow({ colSpan, label, rows = 5 }: Omit<AdminLoadingStateProps, 'compact'> & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} data-label="">
        <AdminLoadingState label={label} rows={rows} compact />
      </td>
    </tr>
  )
}

export default AdminLoadingState
