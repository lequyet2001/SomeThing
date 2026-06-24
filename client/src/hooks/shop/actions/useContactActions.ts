import { shopApi } from '../../../services/shopApi'
import type { ContactFormValues, SetNoticeFn, User } from '../../../types/shop'
import { getErrorMessage } from '../../../utils/errorMessage'

export function useContactActions({ setNotice, user }: { setNotice: SetNoticeFn; user: User | null }) {
  async function submitContact(values: ContactFormValues) {
    const fallbackName = user?.name || user?.email?.split('@')[0] || ''
    try {
      const data = await shopApi.sendContact({
        name: values.name || fallbackName,
        email: values.email || user?.email || '',
        phone: values.phone || user?.phone || '',
        topic: values.topic,
        message: values.message,
      })
      setNotice(data.message)
      window.dispatchEvent(new Event('marseille04:contacts-changed'))
      return true
    } catch (error) {
      setNotice(getErrorMessage(error))
      return false
    }
  }

  return { submitContact }
}
