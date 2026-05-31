import { useState } from 'react'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLanguage } from '../i18n/LanguageContext'

function getResetPath(resetUrl) {
  try {
    const url = new URL(resetUrl)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return resetUrl
  }
}

function ForgotPasswordPage({ onSubmit }) {
  const { t } = useLanguage()
  const [resetData, setResetData] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    setIsSubmitting(true)
    try {
      const data = await onSubmit(event)
      setResetData(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="auth-kicker"><ShieldCheck size={15} /> {t('auth.passwordHelp')}</p>
        <h1>{t('auth.forgotPassword')}</h1>
        <p className="auth-description">{t('auth.forgotPasswordText')}</p>
        <label>
          {t('auth.email')}
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <button className="primary-action" disabled={isSubmitting}>
          <Mail size={17} />
          {isSubmitting ? t('auth.sendingReset') : t('auth.sendResetLink')}
        </button>

        {resetData?.resetUrl && (
          <div className="auth-dev-link">
            <strong>{t('auth.devResetLink')}</strong>
            <p>{t('auth.devResetText', { count: resetData.expiresInMinutes || 30 })}</p>
            <Link to={getResetPath(resetData.resetUrl)}>{t('auth.openResetPage')}</Link>
          </div>
        )}

        <Link className="link-button" to="/login">
          <ArrowLeft size={16} />
          {t('auth.backToLogin')}
        </Link>
      </form>
    </section>
  )
}

export default ForgotPasswordPage
