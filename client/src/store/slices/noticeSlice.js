import { createSlice, nanoid } from '@reduxjs/toolkit'

function buildNotice(payload) {
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

const noticeSlice = createSlice({
  name: 'notice',
  initialState: {
    items: [],
    message: '',
  },
  reducers: {
    setNotice: {
      reducer(state, action) {
        const notice = action.payload
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
      prepare(payload) {
        return { payload: buildNotice(payload) }
      },
    },
    dismissNotice(state, action) {
      const noticeId = action.payload
      if (!noticeId) {
        state.items = []
        state.message = ''
        return
      }

      state.items = state.items.filter((item) => item.id !== noticeId)
      state.message = state.items.at(-1)?.message || ''
    },
  },
})

export const noticeActions = noticeSlice.actions
export const noticeReducer = noticeSlice.reducer
