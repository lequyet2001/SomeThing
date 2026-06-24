import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { CreditCard, Mail, MapPin, Send, User as UserIcon } from 'lucide-react'
import OrderSummary from '../components/OrderSummary'
import { FieldError } from '../components/forms/FieldError'
import {
  CustomerSectionHeader,
  customerInputGroupClass,
  customerPanelClass,
  customerPrimaryButtonClass,
} from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import type { CartLine, CheckoutFormValues, ShippingAddress, User } from '../types/shop'
import { getAriaInvalid } from '../utils/a11y'
import { createCheckoutSchema } from '../utils/validationSchemas'

function getUserAddresses(user: User | null): ShippingAddress[] {
  if (Array.isArray(user?.shippingAddresses) && user.shippingAddresses.length > 0) {
    return user.shippingAddresses
  }

  return user?.address ? [{ id: 'default-address', label: 'Mặc định', recipient: user.name, phone: user.phone || '', address: user.address }] : []
}

function CheckoutPage({
  cartLines,
  subtotal,
  shipping,
  total,
  user,
  onSubmitCheckout,
}: {
  cartLines: CartLine[]
  subtotal: number
  shipping: number
  total: number
  user: User | null
  onSubmitCheckout: (values: CheckoutFormValues) => Promise<unknown>
}) {
  const { t } = useLanguage()
  const savedAddresses = useMemo(() => getUserAddresses(user), [user])
  const initialAddress = savedAddresses.find((item) => item.id === user?.selectedAddressId) || savedAddresses[0] || null
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(createCheckoutSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      address: initialAddress?.address || '',
      email: user?.email || '',
      name: user?.name || '',
      payment: t('checkout.cod'),
      phone: initialAddress?.phone || user?.phone || '',
      selectedAddressId: initialAddress?.id || '',
    },
  })

  const selectedAddressId = watch('selectedAddressId')
  const addressField = register('address')
  const emailField = register('email')
  const nameField = register('name')
  const paymentField = register('payment')
  const phoneField = register('phone')

  useEffect(() => {
    const nextAddress = savedAddresses.find((item) => item.id === user?.selectedAddressId) || savedAddresses[0] || null
    reset({
      address: nextAddress?.address || '',
      email: user?.email || '',
      name: user?.name || '',
      payment: t('checkout.cod'),
      phone: nextAddress?.phone || user?.phone || '',
      selectedAddressId: nextAddress?.id || '',
    })
  }, [reset, savedAddresses, t, user?.email, user?.name, user?.phone, user?.selectedAddressId])

  function handleSavedAddressChange(addressId: string) {
    const nextAddress = savedAddresses.find((item) => item.id === addressId)
    setValue('selectedAddressId', addressId)
    setValue('address', nextAddress?.address || '', { shouldDirty: true, shouldValidate: true })
    setValue('phone', nextAddress?.phone || user?.phone || '', { shouldDirty: true, shouldValidate: true })
  }

  function handleValidatedSubmit(values: CheckoutFormValues) {
    return onSubmitCheckout(values)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form className={`${customerPanelClass} grid gap-5`} noValidate onSubmit={handleSubmit(handleValidatedSubmit)}>
        <CustomerSectionHeader
          eyebrow={<><CreditCard size={15} /> {t('common.checkout')}</>}
          title={t('checkout.title')}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <label className={customerInputGroupClass}>
            <span className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><UserIcon size={15} /> {t('auth.name')}</span>
            <input {...nameField} aria-invalid={getAriaInvalid(errors.name)} autoComplete="name" />
            <FieldError error={errors.name} />
          </label>
          <label className={customerInputGroupClass}>
            <span className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><Mail size={15} /> Email</span>
            <input {...emailField} aria-invalid={getAriaInvalid(errors.email)} autoComplete="email" type="email" />
            <FieldError error={errors.email} />
          </label>
          <label className={customerInputGroupClass}>
            <span className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><UserIcon size={15} /> {t('contact.phone')}</span>
            <input {...phoneField} aria-invalid={getAriaInvalid(errors.phone)} autoComplete="tel" placeholder="090..." />
            <FieldError error={errors.phone} />
          </label>
          <label className={customerInputGroupClass}>
            <span className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><CreditCard size={15} /> {t('checkout.paymentMethod')}</span>
            <select {...paymentField} aria-invalid={getAriaInvalid(errors.payment)}>
              <option value={t('checkout.cod')}>{t('checkout.cod')}</option>
              <option value={t('checkout.bank')}>{t('checkout.bank')}</option>
              <option value={t('checkout.card')}>{t('checkout.card')}</option>
            </select>
            <FieldError error={errors.payment} />
          </label>
        </div>

        <label className={customerInputGroupClass}>
          <span className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><MapPin size={15} /> {t('checkout.address')}</span>
          {savedAddresses.length > 0 && (
            <select {...register('selectedAddressId')} value={selectedAddressId || ''} onChange={(event) => handleSavedAddressChange(event.target.value)}>
              {savedAddresses.map((item) => (
                <option key={item.id} value={item.id}>{item.label || item.address}</option>
              ))}
            </select>
          )}
          <input
            {...addressField}
            aria-invalid={getAriaInvalid(errors.address)}
            autoComplete="street-address"
            placeholder={t('checkout.addressPlaceholder')}
          />
          <FieldError error={errors.address} />
        </label>

        <button className={customerPrimaryButtonClass} disabled={cartLines.length === 0 || isSubmitting}>
          <Send size={17} />
          {t('checkout.order')}
        </button>
      </form>
      <OrderSummary subtotal={subtotal} shipping={shipping} total={total} onCheckout={() => {}} />
    </section>
  )
}

export default CheckoutPage
