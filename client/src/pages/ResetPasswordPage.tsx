import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { FieldError } from '../components/forms/FieldError'
import { customerPanelClass, customerPrimaryButtonClass, customerSecondaryButtonClass } from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import { getAriaInvalid } from '../utils/a11y'
import { createResetPasswordSchema } from '../utils/validationSchemas'

interface ResetPasswordValues {
  confirmPassword: string
  password: string
}

function ResetPasswordPage({ onSubmit }: { onSubmit: (values: ResetPasswordValues, token: string) => Promise<unknown> }) {
  const { token = '' } = useParams()
  const { t } = useLanguage()
  const [isComplete, setIsComplete] = useState(false)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(createResetPasswordSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      confirmPassword: '',
      password: '',
    },
  })

  async function handleValidatedSubmit(values: ResetPasswordValues) {
    const data = await onSubmit(values, token)
    if (data) {
      reset()
      setIsComplete(true)
    }
  }

  return (
    <section className="mx-auto grid min-h-[60vh] max-w-md place-items-center">
      <form className={`${customerPanelClass} grid w-full gap-4`} noValidate onSubmit={handleSubmit(handleValidatedSubmit)}>
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><KeyRound size={15} /> {t('auth.resetPassword')}</p>
        <h1>{isComplete ? t('auth.resetComplete') : t('auth.newPassword')}</h1>

        {isComplete ? (
          <>
            <p className="max-w-3xl text-base font-semibold leading-7 text-muted">{t('auth.resetCompleteText')}</p>
            <Link className={customerPrimaryButtonClass} to="/login">{t('auth.login')}</Link>
          </>
        ) : (
          <>
            <p className="max-w-3xl text-base font-semibold leading-7 text-muted">{t('auth.resetPasswordText')}</p>
            <label>
              {t('auth.newPassword')}
              <input {...register('password')} aria-invalid={getAriaInvalid(errors.password)} autoComplete="new-password" type="password" />
              <FieldError error={errors.password} />
            </label>
            <label>
              {t('auth.confirmPassword')}
              <input {...register('confirmPassword')} aria-invalid={getAriaInvalid(errors.confirmPassword)} autoComplete="new-password" type="password" />
              <FieldError error={errors.confirmPassword} />
            </label>
            <button className={customerPrimaryButtonClass} disabled={isSubmitting}>
              <KeyRound size={17} />
              {isSubmitting ? t('auth.resettingPassword') : t('auth.updatePassword')}
            </button>
          </>
        )}

        <Link className={customerSecondaryButtonClass} to="/login">
          <ArrowLeft size={16} />
          {t('auth.backToLogin')}
        </Link>
      </form>
    </section>
  )
}

export default ResetPasswordPage
