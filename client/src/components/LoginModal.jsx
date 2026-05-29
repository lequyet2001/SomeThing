import { useLanguage } from '../i18n/LanguageContext'

function LoginModal({ onClose, onSubmit }) {
  const { t } = useLanguage()

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="review-login-title">
        <div className="modal-heading">
          <div>
            <p>{t('modal.loginRequired')}</p>
            <h2 id="review-login-title">{t('modal.reviewTitle')}</h2>
          </div>
          <button type="button" aria-label={t('common.close')} onClick={onClose}>x</button>
        </div>

        <form className="modal-login-form" onSubmit={onSubmit}>
          <label>
            Email
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>
          <label>
            {t('auth.password')}
            <input name="password" type="password" required minLength="6" />
          </label>
          <button className="primary-action">{t('auth.login')}</button>
        </form>
      </section>
    </div>
  )
}

export default LoginModal
