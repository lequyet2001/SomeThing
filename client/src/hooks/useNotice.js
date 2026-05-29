import { useEffect, useState } from 'react'

export function useNotice(timeout = 5000) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!message) return undefined

    const timer = window.setTimeout(() => {
      setMessage('')
    }, timeout)

    return () => window.clearTimeout(timer)
  }, [message, timeout])

  return { message, setMessage }
}
