import clsx from 'clsx'

type FieldErrorLike = string | { message?: string } | null | undefined

function getErrorText(error: FieldErrorLike) {
  if (!error) return ''
  return typeof error === 'string' ? error : error.message || ''
}

export function FieldError({ className = '', error, id }: { className?: string; error?: FieldErrorLike; id?: string }) {
  const text = getErrorText(error)
  if (!text) return null

  return (
    <span className={clsx('text-sm font-bold text-red-600', className)} id={id} role="alert">
      {text}
    </span>
  )
}

export function hasFieldError(error?: FieldErrorLike) {
  return Boolean(getErrorText(error))
}
