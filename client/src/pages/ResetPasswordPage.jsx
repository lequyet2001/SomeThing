import { useState } from 'react'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { useLanguage } from '../i18n/LanguageContext'

function ResetPasswordPage({ onSubmit }) {
  const { token = '' } = useParams()
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  async function handleSubmit(event) {
    setIsSubmitting(true)
    try {
      const data = await onSubmit(event, token)
      if (data) {
        setIsComplete(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="auth-kicker"><KeyRound size={15} /> {t('auth.resetPassword')}</p>
        <h1>{isComplete ? t('auth.resetComplete') : t('auth.newPassword')}</h1>

        {isComplete ? (
          <>
            <p className="auth-description">{t('auth.resetCompleteText')}</p>
            <Link className="primary-action" to="/login">{t('auth.login')}</Link>
          </>
        ) : (
          <>
            <p className="auth-description">{t('auth.resetPasswordText')}</p>
            <label>
              {t('auth.newPassword')}
              <input name="password" type="password" autoComplete="new-password" minLength="6" required />
            </label>
            <label>
              {t('auth.confirmPassword')}
              <input name="confirmPassword" type="password" autoComplete="new-password" minLength="6" required />
            </label>
            <button className="primary-action" disabled={isSubmitting}>
              <KeyRound size={17} />
              {isSubmitting ? t('auth.resettingPassword') : t('auth.updatePassword')}
            </button>
          </>
        )}

        <Link className="link-button" to="/login">
          <ArrowLeft size={16} />
          {t('auth.backToLogin')}
        </Link>
      </form>
    </section>
  )
}

export default ResetPasswordPage
