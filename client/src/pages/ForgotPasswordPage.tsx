import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { FieldError } from '../components/forms/FieldError'
import { customerPanelClass, customerPrimaryButtonClass, customerSecondaryButtonClass } from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import type { AuthFormValues } from '../types/shop'
import { getAriaInvalid } from '../utils/a11y'
import { createPasswordResetRequestSchema } from '../utils/validationSchemas'

interface PasswordResetResponse {
  message?: string
  expiresInMinutes?: number
  resetUrl?: string
}

function getResetPath(resetUrl: string) {
  try {
    const url = new URL(resetUrl)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return resetUrl
  }
}

function ForgotPasswordPage({ onSubmit }: { onSubmit: (values: Pick<AuthFormValues, 'email'>) => Promise<PasswordResetResponse | null> }) {
  const { t } = useLanguage()
  const [resetData, setResetData] = useState<PasswordResetResponse | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<Pick<AuthFormValues, 'email'>>({
    resolver: zodResolver(createPasswordResetRequestSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  })

  async function handleValidatedSubmit(values: Pick<AuthFormValues, 'email'>) {
    const data = await onSubmit(values)
    setResetData(data)
  }

  return (
    <section className="mx-auto grid min-h-[60vh] max-w-md place-items-center">
      <form className={`${customerPanelClass} grid w-full gap-4`} noValidate onSubmit={handleSubmit(handleValidatedSubmit)}>
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><ShieldCheck size={15} /> {t('auth.passwordHelp')}</p>
        <h1>{t('auth.forgotPassword')}</h1>
        <p className="max-w-3xl text-base font-semibold leading-7 text-muted">{t('auth.forgotPasswordText')}</p>
        <label>
          {t('auth.email')}
          <input {...register('email')} aria-invalid={getAriaInvalid(errors.email)} autoComplete="email" type="email" />
          <FieldError error={errors.email} />
        </label>
        <button className={customerPrimaryButtonClass} disabled={isSubmitting}>
          <Mail size={17} />
          {isSubmitting ? t('auth.sendingReset') : t('auth.sendResetLink')}
        </button>

        {resetData?.resetUrl && (
          <div className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            <strong>{t('auth.devResetLink')}</strong>
            <p>{t('auth.devResetText', { count: resetData.expiresInMinutes || 30 })}</p>
            <Link className="font-black text-emerald-900 underline underline-offset-4" to={getResetPath(resetData.resetUrl)}>{t('auth.openResetPage')}</Link>
          </div>
        )}

        <Link className={customerSecondaryButtonClass} to="/login">
          <ArrowLeft size={16} />
          {t('auth.backToLogin')}
        </Link>
      </form>
    </section>
  )
}

export default ForgotPasswordPage
