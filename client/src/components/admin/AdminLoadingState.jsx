import { LoaderCircle } from 'lucide-react'

function AdminLoadingState({ label, rows = 5, compact = false }) {
  return (
    <div className={`admin-loading-state${compact ? ' is-compact' : ''}`} aria-busy="true" aria-live="polite">
      <div className="admin-loading-title">
        <LoaderCircle className="button-spinner" size={18} />
        <strong>{label}</strong>
      </div>
      <div className="admin-loading-lines" aria-hidden="true">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="admin-loading-line-row">
            <span />
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminSectionLoading({ label, rows = 6 }) {
  return (
    <section className="admin-panel admin-loading-panel">
      <AdminLoadingState label={label} rows={rows} />
    </section>
  )
}

export function AdminTableLoadingRow({ colSpan, label, rows = 5 }) {
  return (
    <tr className="admin-loading-table-row">
      <td colSpan={colSpan} data-label="">
        <AdminLoadingState label={label} rows={rows} compact />
      </td>
    </tr>
  )
}

export default AdminLoadingState
