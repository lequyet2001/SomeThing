import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const notificationIcons = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
}

function getNotificationType(message) {
  const normalizedMessage = message.toLowerCase()
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

function Notification({ message, onClose }) {
  const { t } = useLanguage()
  if (!message) return null

  const type = getNotificationType(message)
  const Icon = notificationIcons[type]

  return (
    <div className={`notification notification-${type}`} role="status" aria-live="polite">
      <Icon size={20} />
      <p>{message}</p>
      <button type="button" aria-label={t('common.close')} onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  )
}

export default Notification
