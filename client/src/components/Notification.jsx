import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const notificationIcons = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
}

function normalizeMessage(message) {
  return String(message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function getNotificationType(notice) {
  if (notice.type) return notice.type

  const normalizedMessage = normalizeMessage(notice.message)
  if (
    normalizedMessage.includes('khong') ||
    normalizedMessage.includes('loi') ||
    normalizedMessage.includes('that bai') ||
    normalizedMessage.includes('403') ||
    normalizedMessage.includes('401')
  ) {
    return 'error'
  }

  if (normalizedMessage.includes('da ') || normalizedMessage.includes('thanh cong')) {
    return 'success'
  }

  return 'info'
}

function NotificationItem({ notice, onClose, onOpen }) {
  const { t } = useLanguage()
  const type = getNotificationType(notice)
  const Icon = notificationIcons[type] || Info
  const canOpen = Boolean(notice.actionPath && onOpen)

  useEffect(() => {
    if (notice.duration === 0) return undefined

    const timer = window.setTimeout(
      () => onClose(notice.id),
      notice.duration || (type === 'error' ? 7000 : 4800),
    )

    return () => window.clearTimeout(timer)
  }, [notice.duration, notice.id, onClose, type])

  const content = (
    <>
      <Icon size={20} />
      <div>
        {notice.title && <strong>{notice.title}</strong>}
        <p>{notice.message}</p>
        {notice.actionLabel && <span>{notice.actionLabel}</span>}
      </div>
    </>
  )

  return (
    <article className={`notification notification-${type}`} role="status" aria-live="polite">
      {canOpen ? (
        <button type="button" className="notification-main" onClick={() => onOpen(notice)}>
          {content}
        </button>
      ) : (
        <div className="notification-main">
          {content}
        </div>
      )}
      <button type="button" className="notification-close" aria-label={t('common.close')} onClick={() => onClose(notice.id)}>
        <X size={18} />
      </button>
    </article>
  )
}

function Notification({ notices = [], message, onClose, onOpen }) {
  const items = notices.length > 0
    ? notices
    : message
      ? [{ id: 'legacy-notice', message }]
      : []

  if (items.length === 0) return null

  return (
    <div className="notification-stack">
      {items.map((notice) => (
        <NotificationItem
          key={notice.id}
          notice={notice}
          onClose={onClose}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}

export default Notification
