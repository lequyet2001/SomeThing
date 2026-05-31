import { shopApi } from '../../../services/shopApi'

export function useContactActions({ setNotice }) {
  async function submitContact(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      const data = await shopApi.sendContact({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
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
