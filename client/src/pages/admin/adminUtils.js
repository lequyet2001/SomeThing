export const orderStatusOptions = [
  { value: 'confirmed', labelKey: 'admin.orderStatus.confirmed' },
  { value: 'paid', labelKey: 'admin.orderStatus.paid' },
  { value: 'shipping', labelKey: 'admin.orderStatus.shipping' },
  { value: 'completed', labelKey: 'admin.orderStatus.completed' },
  { value: 'cancelled', labelKey: 'admin.orderStatus.cancelled' },
]

export const pendingOrderStatuses = ['confirmed', 'paid', 'shipping']

export const contactStatusOptions = [
  { value: 'new', labelKey: 'admin.contactStatus.new' },
  { value: 'processing', labelKey: 'admin.contactStatus.processing' },
  { value: 'done', labelKey: 'admin.contactStatus.done' },
]

export const pendingContactStatuses = ['new', 'processing']

export const emptyStatsFilters = {
  mode: 'month',
  month: '',
  startDate: '',
  endDate: '',
}

export const emptyAdminFilters = {
  orders: { query: '', status: 'all', payment: 'all', minTotal: '', maxTotal: '', startDate: '', endDate: '' },
  users: { query: '', role: 'all', address: 'all' },
  contacts: { query: '', status: 'all', startDate: '', endDate: '' },
  reviews: { query: '', rating: 'all', startDate: '', endDate: '' },
  lowStock: { query: '', category: 'all' },
}

export function formatAdminDate(value, language, emptyText) {
  if (!value) return emptyText
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function matchesSearch(fields, query) {
  const keyword = normalizeText(query).trim()
  if (!keyword) return true
  return fields.some((field) => normalizeText(field).includes(keyword))
}

export function isWithinNumberRange(value, minValue, maxValue) {
  const number = Number(value) || 0
  const min = minValue === '' ? null : Number(minValue)
  const max = maxValue === '' ? null : Number(maxValue)

  return (min === null || number >= min) && (max === null || number <= max)
}

export function getDateBoundary(value, time) {
  if (!value) return null
  const timestamp = new Date(`${value}T${time}`).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

export function isWithinDateRange(value, startDate, endDate) {
  if (!startDate && !endDate) return true
  if (!value) return false

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return false

  const start = getDateBoundary(startDate, '00:00:00')
  const end = getDateBoundary(endDate, '23:59:59.999')

  return (start === null || timestamp >= start) && (end === null || timestamp <= end)
}

export function countStatuses(statusStats = [], statuses) {
  return statusStats
    .filter((item) => statuses.includes(item.status))
    .reduce((sum, item) => sum + (Number(item.count) || 0), 0)
}

export function buildSummaryParams(filters) {
  if (filters.mode === 'month') {
    return filters.month ? { month: filters.month } : {}
  }

  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
  }
}

export function notifyCatalogChanged() {
  window.dispatchEvent(new Event('marseille04:catalog-changed'))
}

export function notifyReviewsChanged() {
  window.dispatchEvent(new Event('marseille04:reviews-changed'))
}
