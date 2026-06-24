import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

import type { AdminToastProps } from '../../types/shop'

function getToastClass(type: AdminToastProps['toast']['type']) {
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-900'
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  return 'border-primary/30 bg-blue-50 text-primaryDark'
}

function AdminToast({ closeLabel, onClose, onOpen, toast }: AdminToastProps) {
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
    <div className={`flex items-start gap-3 rounded-md border p-3 shadow-soft ${getToastClass(toast.type)}`} role="status" aria-live="polite">
      {onOpen ? (
        <button type="button" className="flex flex-1 items-start gap-3 border-0 bg-transparent p-0 text-left shadow-none" onClick={onOpen}>
          {content}
        </button>
      ) : (
        <div className="flex flex-1 items-start gap-3 border-0 bg-transparent p-0 text-left shadow-none">
          {content}
        </div>
      )}
      <button type="button" className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-white text-muted shadow-soft hover:border-primary hover:text-primaryDark" aria-label={closeLabel} onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  )
}

export default AdminToast
