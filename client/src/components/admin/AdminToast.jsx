import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

function AdminToast({ closeLabel, onClose, onOpen, toast }) {
  if (!toast.message) return null

  const Icon = toast.type === 'error' ? AlertTriangle : toast.type === 'info' ? Info : CheckCircle2
  const content = (
    <>
      <Icon size={22} />
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
    </>
  )

  return (
    <div className={`admin-toast admin-toast-${toast.type}`} role="status" aria-live="polite">
      {onOpen ? (
        <button type="button" className="admin-toast-main" onClick={onOpen}>
          {content}
        </button>
      ) : (
        <div className="admin-toast-main">
          {content}
        </div>
      )}
      <button type="button" className="admin-toast-close" aria-label={closeLabel} onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  )
}

export default AdminToast
