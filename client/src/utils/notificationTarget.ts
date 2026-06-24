import type { UserNotification } from '../types/shop'

function buildQueryPath(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, String(value))
  })

  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}

export function buildNotificationTargetPath(notification?: UserNotification) {
  if (!notification) return '/account'

  const metadata = notification.metadata || {}
  const orderCode = metadata.orderCode || metadata.orderId
  if (orderCode) {
    return buildQueryPath('/account', {
      focus: 'order',
      order: orderCode,
    })
  }
  if (notification.type === 'order') return '/account?focus=orders'

  const contactId = metadata.contactId || metadata.contact
  if (contactId) {
    return buildQueryPath('/account', {
      focus: 'contact',
      contact: contactId,
    })
  }
  if (notification.type === 'contact') return '/account?focus=support'

  return notification.link || '/account'
}

export function emitAccountTarget(path: string) {
  if (typeof window === 'undefined' || !path) return

  const url = new URL(path, window.location.origin)
  if (url.pathname !== '/account') return

  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('marseille04:account-target', {
      detail: { search: url.search },
    }))
  }, 0)
}
