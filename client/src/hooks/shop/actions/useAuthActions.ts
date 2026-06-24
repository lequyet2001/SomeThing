import type { FormEvent } from 'react'
import type { NavigateFunction } from 'react-router-dom'

import { clearAuth, saveAuth, saveStoredUser, shopApi } from '../../../services/shopApi'
import { uiActions, userActions } from '../../../store/shopStore'
import type { AppDispatch } from '../../../store/shopStore'
import type { AuthFormValues, AuthMode, SetNoticeFn } from '../../../types/shop'
import { getErrorMessage } from '../../../utils/errorMessage'

interface PasswordResetRequestValues {
  email: string
}

interface ResetPasswordValues {
  confirmPassword: string
  password: string
}

export function useAuthActions({
  dispatch,
  navigate,
  setNotice,
}: {
  dispatch: AppDispatch
  navigate: NavigateFunction
  setNotice: SetNoticeFn
}) {
  async function handleAuth(values: AuthFormValues, mode: AuthMode) {
    const payload: { email: string; password: string; name?: string } = {
      email: values.email,
      password: values.password,
    }

    if (mode === 'register') {
      payload.name = values.name || 'Khách hàng'
    }

    try {
      const data = mode === 'register' ? await shopApi.register(payload) : await shopApi.login(payload)
      saveAuth(data)
      dispatch(userActions.setUser(data.user))
      setNotice(data.message)
      navigate('/')
    } catch (error) {
      setNotice(getErrorMessage(error))
    }
  }

  async function handleReviewLogin(values: AuthFormValues) {
    try {
      const data = await shopApi.login({
        email: values.email,
        password: values.password,
      })
      saveAuth(data)
      dispatch(userActions.setUser(data.user))
      setNotice('Đăng nhập thành công. Bạn có thể gửi đánh giá.')
      dispatch(uiActions.setShowReviewLogin(false))
    } catch (error) {
      setNotice(getErrorMessage(error))
    }
  }

  async function requestPasswordReset(values: PasswordResetRequestValues) {
    try {
      const data = await shopApi.forgotPassword({
        email: values.email,
      })
      setNotice(data.message)
      return data
    } catch (error) {
      setNotice(getErrorMessage(error))
      return null
    }
  }

  async function resetPassword(values: ResetPasswordValues, token: string) {
    const password = String(values.password || '')
    const confirmPassword = String(values.confirmPassword || '')

    if (password !== confirmPassword) {
      setNotice('Mật khẩu xác nhận không khớp.')
      return null
    }

    try {
      const data = await shopApi.resetPassword(token, { password })
      setNotice(data.message)
      return data
    } catch (error) {
      setNotice(getErrorMessage(error))
      return null
    }
  }

  function logout() {
    clearAuth()
    dispatch(userActions.clearUser())
    setNotice('Đã đăng xuất.')
    navigate('/login')
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      const payload = {
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        avatar: String(formData.get('avatar') || ''),
        phone: String(formData.get('phone') || ''),
        address: String(formData.get('address') || ''),
        selectedAddressId: String(formData.get('selectedAddressId') || ''),
        shippingAddresses: JSON.parse(String(formData.get('shippingAddresses') || '[]')),
      }
      const data = await shopApi.updateProfile(payload)
      const storedUser = saveStoredUser(data.user)
      if (!storedUser) throw new Error('API trả về thông tin người dùng không hợp lệ.')
      dispatch(userActions.setUser(storedUser))
      setNotice(data.message)
      return true
    } catch (error) {
      setNotice(getErrorMessage(error))
      return false
    }
  }

  return {
    handleAuth,
    handleReviewLogin,
    logout,
    requestPasswordReset,
    resetPassword,
    submitProfile,
  }
}
