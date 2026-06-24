import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FieldError } from './forms/FieldError'
import AppDialog from './ui/AppDialog'
import { useLanguage } from '../i18n/LanguageContext'
import type { AuthFormValues } from '../types/shop'
import { getAriaInvalid } from '../utils/a11y'
import { createAuthSchema } from '../utils/validationSchemas'

function LoginModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: AuthFormValues) => Promise<unknown> }) {
  const { t } = useLanguage()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(createAuthSchema(t, 'login')),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function handleValidatedSubmit(values: AuthFormValues) {
    return onSubmit(values)
  }

  return (
    <AppDialog
      className="max-w-md"
      isOpen
      onClose={onClose}
      title={t('modal.reviewTitle')}
      description={t('modal.loginRequired')}
    >
        <form className="grid gap-4" noValidate onSubmit={handleSubmit(handleValidatedSubmit)}>
          <label>
            Email
            <input {...register('email')} aria-invalid={getAriaInvalid(errors.email)} autoComplete="email" type="email" placeholder="you@example.com" />
            <FieldError error={errors.email} />
          </label>
          <label>
            {t('auth.password')}
            <input {...register('password')} aria-invalid={getAriaInvalid(errors.password)} autoComplete="current-password" type="password" />
            <FieldError error={errors.password} />
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:shadow-panel focus:outline-none focus:ring-4 focus:ring-primary/20" disabled={isSubmitting}>{t('auth.login')}</button>
        </form>
    </AppDialog>
  )
}

export default LoginModal
