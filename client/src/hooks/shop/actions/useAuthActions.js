import { clearAuth, saveAuth, shopApi } from '../../../services/shopApi'
import { uiActions, userActions } from '../../../store/shopStore'

export function useAuthActions({ dispatch, navigate, setNotice }) {
  async function handleAuth(event, mode) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
    }

    if (mode === 'register') {
      payload.name = formData.get('name') || 'Khách hàng'
    }

    try {
      const data = mode === 'register' ? await shopApi.register(payload) : await shopApi.login(payload)
      saveAuth(data)
      dispatch(userActions.setUser(data.user))
      setNotice(data.message)
      navigate('/')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function handleReviewLogin(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      const data = await shopApi.login({
        email: formData.get('email'),
        password: formData.get('password'),
      })
      saveAuth(data)
      dispatch(userActions.setUser(data.user))
      setNotice('Đăng nhập thành công. Bạn có thể gửi đánh giá.')
      dispatch(uiActions.setShowReviewLogin(false))
    } catch (error) {
      setNotice(error.message)
    }
  }

  function logout() {
    clearAuth()
    dispatch(userActions.clearUser())
    setNotice('Đã đăng xuất.')
    navigate('/login')
  }

  async function submitProfile(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        avatar: formData.get('avatar') || '',
        phone: formData.get('phone'),
        address: formData.get('address'),
        selectedAddressId: formData.get('selectedAddressId'),
        shippingAddresses: JSON.parse(formData.get('shippingAddresses') || '[]'),
      }
      const data = await shopApi.updateProfile(payload)
      localStorage.setItem('marseille04_user', JSON.stringify(data.user))
      dispatch(userActions.setUser(data.user))
      setNotice(data.message)
    } catch (error) {
      setNotice(error.message)
    }
  }

  return {
    handleAuth,
    handleReviewLogin,
    logout,
    submitProfile,
  }
}
