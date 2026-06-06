import { SlidersHorizontal, X } from 'lucide-react'

function AdminFilterPanel({ children, className = '', clearLabel, onClear, title }) {
  return (
    <div className={`admin-filter-panel ${className}`.trim()}>
      <div className="admin-filter-title">
        <SlidersHorizontal size={16} />
        <strong>{title}</strong>
      </div>
      <div className="admin-filter-controls">
        {children}
      </div>
      <button type="button" className="admin-filter-clear" onClick={onClear}>
        <X size={15} />
        {clearLabel}
      </button>
    </div>
  )
}

export default AdminFilterPanel
