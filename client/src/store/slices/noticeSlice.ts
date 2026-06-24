import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { Notice, NoticeInput } from '../../types/shop'

interface NoticeState {
  items: Notice[]
  message: string
}

function buildNotice(payload: NoticeInput): Notice | null {
  if (!payload) return null

  const notice = typeof payload === 'string' ? { message: payload } : payload
  const message = String(notice.message || '').trim()
  if (!message) return null

  return {
    id: notice.id || nanoid(),
    actionLabel: notice.actionLabel || '',
    actionPath: notice.actionPath || '',
    dedupeKey: notice.dedupeKey || '',
    duration: notice.duration,
    message,
    title: notice.title || '',
    type: notice.type || '',
  }
}

const initialState: NoticeState = {
  items: [],
  message: '',
}

const noticeSlice = createSlice({
  name: 'notice',
  initialState,
  reducers: {
    setNotice(state, action: PayloadAction<NoticeInput>) {
      const notice = buildNotice(action.payload)
      if (!notice) {
        state.items = []
        state.message = ''
        return
      }

      const currentItems = notice.dedupeKey
        ? state.items.filter((item) => item.dedupeKey !== notice.dedupeKey)
        : state.items

      state.items = [...currentItems, notice].slice(-4)
      state.message = notice.message
    },
    dismissNotice(state, action: PayloadAction<string | null | undefined>) {
      const noticeId = action.payload
      if (!noticeId) {
        state.items = []
        state.message = ''
        return
      }

      state.items = state.items.filter((item) => item.id !== noticeId)
      state.message = state.items[state.items.length - 1]?.message || ''
    },
  },
})

export const noticeActions = noticeSlice.actions
export const noticeReducer = noticeSlice.reducer
