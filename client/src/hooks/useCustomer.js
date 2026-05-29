import { useEffect, useState } from 'react'

import { clearAuth, getStoredUser, getToken, saveAuth, shopApi } from '../services/shopApi'

export function useCustomer(navigate, setNotice) {
  const [user, setUser] = useState(() => getStoredUser())

  useEffect(() => {
    if (!getToken()) return undefined

    let isMounted = true

    async function refreshProfile() {
      try {
        const data = await shopApi.getProfile()
        if (!isMounted) return
        localStorage.setItem('marseille04_user', JSON.stringify(data.user))
        setUser(data.user)
      } catch {
        clearAuth()
        if (isMounted) {
          setUser(null)
        }
      }
    }

    refreshProfile()

    return () => {
      isMounted = false
    }
  }, [])

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
      setUser(data.user)
      setNotice(data.message)
      navigate('/')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function handleReviewLogin(event, onSuccess) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      const data = await shopApi.login({
        email: formData.get('email'),
        password: formData.get('password'),
      })
      saveAuth(data)
      setUser(data.user)
      setNotice('Đăng nhập thành công. Bạn có thể gửi đánh giá.')
      onSuccess()
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function submitProfile(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    }

    try {
      const data = await shopApi.updateProfile(payload)
      localStorage.setItem('marseille04_user', JSON.stringify(data.user))
      setUser(data.user)
      setNotice(data.message)
    } catch (error) {
      setNotice(error.message)
    }
  }

  function logout() {
    clearAuth()
    setUser(null)
    setNotice('Đã đăng xuất.')
    navigate('/login')
  }

  return {
    handleAuth,
    handleReviewLogin,
    logout,
    setUser,
    submitProfile,
    user,
  }
}
