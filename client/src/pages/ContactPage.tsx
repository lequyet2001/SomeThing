import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { FieldError } from '../components/forms/FieldError'
import {
  CustomerHero,
  customerCardClass,
  customerInputGroupClass,
  customerPanelClass,
  customerPrimaryButtonClass,
} from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import type { ContactFormValues, User } from '../types/shop'
import { getAriaInvalid } from '../utils/a11y'
import { createContactSchema } from '../utils/validationSchemas'

function ContactPage({
  onSubmitContact,
  user,
}: {
  onSubmitContact: (values: ContactFormValues) => Promise<boolean>
  user: User | null
}) {
  const { t } = useLanguage()
  const isSignedIn = Boolean(user?.email)
  const schema = useMemo(() => createContactSchema(t, isSignedIn), [isSignedIn, t])
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      message: '',
      name: '',
      phone: '',
      topic: t('contact.topicProduct'),
    },
  })

  async function handleValidatedSubmit(values: ContactFormValues) {
    const saved = await onSubmitContact(values)
    if (saved !== false) {
      reset({
        email: '',
        message: '',
        name: '',
        phone: '',
        topic: t('contact.topicProduct'),
      })
    }
  }

  return (
    <section className="grid gap-8">
      <CustomerHero
        eyebrow={t('contact.heroKicker')}
        title={t('contact.heroTitle')}
        description={t('contact.heroText')}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form className={`${customerPanelClass} grid gap-4`} noValidate onSubmit={handleSubmit(handleValidatedSubmit)}>
          <h2>{t('contact.formTitle')}</h2>
          {!isSignedIn ? (
            <div className="grid gap-4 md:grid-cols-3">
              <label className={customerInputGroupClass}>
                {t('auth.name')}
                <input {...register('name')} aria-invalid={getAriaInvalid(errors.name)} autoComplete="name" placeholder={t('contact.namePlaceholder')} />
                <FieldError error={errors.name} />
              </label>
              <label className={customerInputGroupClass}>
                Email
                <input {...register('email')} aria-invalid={getAriaInvalid(errors.email)} autoComplete="email" type="email" placeholder="you@example.com" />
                <FieldError error={errors.email} />
              </label>
              <label className={customerInputGroupClass}>
                {t('contact.phone')}
                <input {...register('phone')} aria-invalid={getAriaInvalid(errors.phone)} autoComplete="tel" placeholder="090..." />
                <FieldError error={errors.phone} />
              </label>
            </div>
          ) : null}
          <label className={customerInputGroupClass}>
            {t('contact.topic')}
            <select {...register('topic')} aria-invalid={getAriaInvalid(errors.topic)}>
              <option value={t('contact.topicProduct')}>{t('contact.topicProduct')}</option>
              <option value={t('contact.topicOrder')}>{t('contact.topicOrder')}</option>
              <option value={t('contact.topicPayment')}>{t('contact.topicPayment')}</option>
              <option value={t('contact.topicReturn')}>{t('contact.topicReturn')}</option>
            </select>
            <FieldError error={errors.topic} />
          </label>
          <label className={customerInputGroupClass}>
            {t('contact.content')}
            <textarea {...register('message')} aria-invalid={getAriaInvalid(errors.message)} placeholder={t('contact.messagePlaceholder')} />
            <FieldError error={errors.message} />
          </label>
          <button className={customerPrimaryButtonClass} disabled={isSubmitting}>
            <Send size={17} />
            {t('contact.send')}
          </button>
        </form>

        <aside className="grid h-fit gap-4">
          <article className={customerCardClass}>
            <Phone className="text-primary" size={22} />
            <span className="text-xs font-black uppercase text-primaryDark">Hotline</span>
            <strong className="text-lg font-black text-ink">1900 2404</strong>
            <p className="text-sm font-semibold leading-6 text-muted">{t('contact.supportText')}</p>
          </article>
          <article className={customerCardClass}>
            <Mail className="text-primary" size={22} />
            <span className="text-xs font-black uppercase text-primaryDark">Email</span>
            <strong className="text-lg font-black text-ink">hello@marseille04.vn</strong>
            <p className="text-sm font-semibold leading-6 text-muted">{t('contact.emailResponse')}</p>
          </article>
          <article className={customerCardClass}>
            <MapPin className="text-primary" size={22} />
            <span className="text-xs font-black uppercase text-primaryDark">Showroom</span>
            <strong className="text-lg font-black text-ink">{t('contact.address').replace(/^Địa chỉ: |^Address: /, '')}</strong>
            <p className="text-sm font-semibold leading-6 text-muted">{t('contact.showroomText')}</p>
          </article>
          <article className="grid gap-2 rounded-md border border-lineStrong/50 bg-sky-50 p-4 shadow-liquid ring-1 ring-white/80">
            <Clock className="text-primary" size={22} />
            <span className="text-xs font-black uppercase text-primaryDark">{t('contact.hours')}</span>
            <div><strong className="text-ink">{t('contact.weekdays')}</strong><p className="text-sm font-semibold text-muted">09:00 - 21:00</p></div>
            <div><strong className="text-ink">{t('contact.weekend')}</strong><p className="text-sm font-semibold text-muted">10:00 - 20:00</p></div>
          </article>
        </aside>
      </div>
    </section>
  )
}

export default ContactPage
