import { shopApi } from '../../../services/shopApi'

export function useContactActions({ setNotice, user }) {
  async function submitContact(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const fallbackName = user?.name || user?.email?.split('@')[0] || ''
    try {
      const data = await shopApi.sendContact({
        name: formData.get('name') || fallbackName,
        email: formData.get('email') || user?.email || '',
        phone: formData.get('phone') || user?.phone || '',
        topic: formData.get('topic'),
        message: formData.get('message'),
      })
      setNotice(data.message)
      window.dispatchEvent(new Event('marseille04:contacts-changed'))
      event.currentTarget.reset()
    } catch (error) {
      setNotice(error.message)
    }
  }

  return { submitContact }
}
