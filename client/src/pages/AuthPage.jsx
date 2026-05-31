import { Link } from 'react-router-dom'

import { useLanguage } from '../i18n/LanguageContext'

function AuthPage({ mode, onNavigate, onSubmit }) {
  const { t } = useLanguage()
  const isRegister = mode === 'register'

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={(event) => onSubmit(event, mode)}>
        <h1>{isRegister ? t('auth.register') : t('auth.login')}</h1>
        {isRegister && (
          <label>
            {t('auth.name')}
            <input name="name" required />
          </label>
        )}
        <label>
          {t('auth.email')}
          <input name="email" type="email" required />
        </label>
        <label>
          {t('auth.password')}
          <input name="password" type="password" required minLength="6" />
        </label>
        <button className="primary-action">{isRegister ? t('auth.createAccount') : t('auth.login')}</button>
        {!isRegister && <Link className="link-button" to="/forgot-password">{t('auth.forgotPassword')}</Link>}
        <button type="button" className="link-button" onClick={() => onNavigate(isRegister ? 'login' : 'register')}>
          {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}
        </button>
      </form>
    </section>
  )
}

export default AuthPage
