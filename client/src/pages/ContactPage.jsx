import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

function ContactPage({ onSubmitContact }) {
  const { t } = useLanguage()

  return (
    <section className="contact-page">
      <div className="contact-hero">
        <p className="contact-kicker">{t('contact.heroKicker')}</p>
        <h1>{t('contact.heroTitle')}</h1>
        <p>
          {t('contact.heroText')}
        </p>
      </div>

      <div className="contact-layout">
        <form className="contact-form" onSubmit={onSubmitContact}>
          <h2>{t('contact.formTitle')}</h2>
          <label>
            {t('auth.name')}
            <input name="name" required placeholder={t('contact.namePlaceholder')} />
          </label>
          <label>
            Email
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>
          <label>
            {t('contact.phone')}
            <input name="phone" placeholder="090..." />
          </label>
          <label>
            {t('contact.topic')}
            <select name="topic" defaultValue={t('contact.topicProduct')}>
              <option>{t('contact.topicProduct')}</option>
              <option>{t('contact.topicOrder')}</option>
              <option>{t('contact.topicPayment')}</option>
              <option>{t('contact.topicReturn')}</option>
            </select>
          </label>
          <label>
            {t('contact.content')}
            <textarea name="message" required placeholder={t('contact.messagePlaceholder')} />
          </label>
          <button className="primary-action"><Send size={17} /> {t('contact.send')}</button>
        </form>

        <aside className="contact-info">
          <article>
            <Phone size={22} />
            <span>Hotline</span>
            <strong>1900 2404</strong>
            <p>{t('contact.supportText')}</p>
          </article>
          <article>
            <Mail size={22} />
            <span>Email</span>
            <strong>hello@marseille04.vn</strong>
            <p>{t('contact.emailResponse')}</p>
          </article>
          <article>
            <MapPin size={22} />
            <span>Showroom</span>
            <strong>24 Nguyễn Huệ, Quận 1, TP.HCM</strong>
            <p>{t('contact.showroomText')}</p>
          </article>
          <article className="contact-hours">
            <Clock size={22} />
            <span>{t('contact.hours')}</span>
            <div><strong>{t('contact.weekdays')}</strong><p>09:00 - 21:00</p></div>
            <div><strong>{t('contact.weekend')}</strong><p>10:00 - 20:00</p></div>
          </article>
        </aside>
      </div>
    </section>
  )
}

export default ContactPage
