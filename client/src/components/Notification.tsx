import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import type { Notice } from '../types/shop'

type NotificationKind = 'error' | 'info' | 'success'

const notificationIcons: Record<NotificationKind, typeof Info> = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
}

function normalizeMessage(message: string) {
  return String(message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function getNotificationType(notice: Notice): NotificationKind {
  if (notice.type === 'error' || notice.type === 'info' || notice.type === 'success') return notice.type

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

function getNotificationClass(type: NotificationKind) {
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-800'
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

function NotificationItem({
  notice,
  onClose,
  onOpen,
}: {
  notice: Notice
  onClose: (noticeId: string) => void
  onOpen?: (notice: Notice) => void
}) {
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
    <article className={`flex items-start gap-3 rounded-md border p-3 shadow-soft ${getNotificationClass(type)}`} role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'}>
      {canOpen ? (
        <button type="button" className="flex flex-1 items-start gap-3 border-0 bg-transparent p-0 text-left shadow-none" onClick={() => onOpen?.(notice)}>
          {content}
        </button>
      ) : (
        <div className="flex flex-1 items-start gap-3 border-0 bg-transparent p-0 text-left shadow-none">
          {content}
        </div>
      )}
      <button type="button" className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-white text-muted shadow-soft hover:border-primary hover:text-primaryDark" aria-label={t('common.close')} onClick={() => onClose(notice.id)}>
        <X size={18} />
      </button>
    </article>
  )
}

function Notification({
  notices = [],
  message,
  onClose,
  onOpen,
}: {
  notices?: Notice[]
  message?: string
  onClose: (noticeId: string) => void
  onOpen?: (notice: Notice) => void
}) {
  const items = notices.length > 0
    ? notices
    : message
      ? [{ id: 'legacy-notice', message }]
      : []

  if (items.length === 0) return null

  return (
    <div className="fixed right-4 top-20 z-[120] grid w-[min(380px,calc(100vw-2rem))] gap-3">
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
