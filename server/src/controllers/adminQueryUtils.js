import { httpError } from '../utils/httpError.js'

export const DASHBOARD_TIMEZONE_OFFSET = '+07:00'

export function createLocalDate(dateValue, time = '00:00:00.000') {
  return new Date(`${dateValue}T${time}${DASHBOARD_TIMEZONE_OFFSET}`)
}

export function createDateMatch(field, dateRange) {
  return dateRange ? { [field]: dateRange } : {}
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function readPositiveInteger(value, fallback, maxValue) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, maxValue)
}

export function readPagination(query, defaultLimit = 20) {
  return {
    limit: readPositiveInteger(query.limit, defaultLimit, 100),
    page: readPositiveInteger(query.page, 1, 100000),
    shouldPaginate: query.page !== undefined || query.limit !== undefined,
  }
}

export function createPagination(total, pagination) {
  const totalPages = pagination.shouldPaginate ? Math.max(1, Math.ceil(total / pagination.limit)) : 1

  return {
    hasMore: pagination.shouldPaginate ? pagination.page < totalPages : false,
    limit: pagination.shouldPaginate ? pagination.limit : total,
    page: pagination.shouldPaginate ? pagination.page : 1,
    total,
    totalPages,
  }
}

export function applyPagination(query, pagination) {
  if (!pagination.shouldPaginate) return query
  return query.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit)
}

export function readDateRangeFilter(query) {
  const startDate = String(query.startDate || '').trim()
  const endDate = String(query.endDate || '').trim()
  const dateRange = {}

  if (startDate) {
    const start = createLocalDate(startDate)
    if (Number.isNaN(start.getTime())) {
      throw httpError(400, 'Ngày bắt đầu không hợp lệ.')
    }
    dateRange.$gte = start
  }

  if (endDate) {
    const end = createLocalDate(endDate)
    if (Number.isNaN(end.getTime())) {
      throw httpError(400, 'Ngày kết thúc không hợp lệ.')
    }
    end.setUTCDate(end.getUTCDate() + 1)
    dateRange.$lt = end
  }

  if (dateRange.$gte && dateRange.$lt && dateRange.$gte >= dateRange.$lt) {
    throw httpError(400, 'Khoảng thời gian không hợp lệ.')
  }

  return Object.keys(dateRange).length ? dateRange : null
}
