import { formatCurrency } from '../utils/currency'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { BadgeCheck, CalendarDays, ChevronDown, ChevronUp, History, ImagePlus, LoaderCircle, LogIn, Mail, MapPin, MessageSquare, PackageCheck, Pencil, Phone, Plus, Save, ShoppingCart, Trash2, UploadCloud, User, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { FieldError } from '../components/forms/FieldError'
import {
  CustomerEmptyState,
  customerCardClass,
  customerDangerButtonClass,
  customerMutedPillClass,
  customerPanelClass,
  customerPrimaryButtonClass,
  customerSecondaryButtonClass,
  customerSoftPanelClass,
} from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import { getAriaInvalid } from '../utils/a11y'
import type { ContactRequest, EntityId, Order, ShippingAddress, User as ShopUser } from '../types/shop'
import { createProfileSchema } from '../utils/validationSchemas'

function formatOrderDate(value?: string) {
  if (!value) return 'Mới tạo'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function createAddress(index = 0): ShippingAddress {
  return {
    id: `address-${Date.now()}-${index}`,
    label: index === 0 ? 'Mặc định' : `Địa chỉ ${index + 1}`,
    recipient: '',
    phone: '',
    address: '',
  }
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ORDER_HISTORY_COLLAPSED_LIMIT = 4
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const contactStatusLabelKeys: Record<string, string> = {
  done: 'admin.contactStatus.done',
  new: 'admin.contactStatus.new',
  processing: 'admin.contactStatus.processing',
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result || '')))
    reader.addEventListener('error', () => reject(new Error('Không đọc được ảnh.')))
    reader.readAsDataURL(file)
  })
}

function getAvatarFallback(user: ShopUser | null) {
  return user?.name?.slice(0, 1).toUpperCase() || '?'
}

function toElementSafeId(value: EntityId | string | undefined) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-')
}

function getOrderTargetId(orderId: EntityId) {
  return `account-order-${toElementSafeId(orderId)}`
}

function getContactTargetId(contactId: EntityId) {
  return `account-contact-${toElementSafeId(contactId)}`
}

function getAccountTargetId(search: string) {
  const params = new URLSearchParams(search)
  const focus = params.get('focus')
  const orderCode = params.get('order') || params.get('orderCode')
  const contactId = params.get('contact') || params.get('contactId')

  if (focus === 'order' && orderCode) return getOrderTargetId(orderCode)
  if (focus === 'orders') return 'account-order-history'
  if (focus === 'contact' && contactId) return getContactTargetId(contactId)
  if (focus === 'contacts' || focus === 'support') return 'account-support-history'

  return ''
}

function normalizeAddresses(user: ShopUser | null): ShippingAddress[] {
  if (Array.isArray(user?.shippingAddresses) && user.shippingAddresses.length > 0) {
    return user.shippingAddresses.map((item, index) => ({
      id: item.id || `address-${index}`,
      label: item.label || `Địa chỉ ${index + 1}`,
      recipient: item.recipient || user.name || '',
      phone: item.phone || user.phone || '',
      address: item.address || '',
    }))
  }

  return [{
    id: 'default-address',
    label: 'Mặc định',
    recipient: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  }]
}

function AccountPage({
  cartCount,
  contacts = [],
  contactsLoading = false,
  lastOrder,
  orders = [],
  ordersLoading = false,
  totalInCart,
  user,
  onLogin,
  onSubmitProfile,
}: {
  cartCount: number
  contacts?: ContactRequest[]
  contactsLoading?: boolean
  lastOrder?: Order | null
  orders?: Order[]
  ordersLoading?: boolean
  totalInCart: number
  user: ShopUser | null
  onLogin: () => void
  onSubmitProfile: (event: FormEvent<HTMLFormElement>) => Promise<boolean>
}) {
  const { t } = useLanguage()
  const location = useLocation()
  const latestOrder = lastOrder || orders[0]
  const initialAddresses = useMemo(() => normalizeAddresses(user), [user])
  const [addresses, setAddresses] = useState<ShippingAddress[]>(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState(user?.selectedAddressId || initialAddresses[0]?.id || '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [avatarError, setAvatarError] = useState('')
  const [highlightTargetId, setHighlightTargetId] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isOrderHistoryExpanded, setIsOrderHistoryExpanded] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setAddresses(initialAddresses)
    setSelectedAddressId(user?.selectedAddressId || initialAddresses[0]?.id || '')
    setAvatarPreview(user?.avatar || '')
    setAvatarError('')
    setIsEditingProfile(false)
    setIsProfileSaving(false)
    setProfileErrors({})
  }, [initialAddresses, user?.avatar, user?.selectedAddressId])

  const selectedAddress = addresses.find((item) => item.id === selectedAddressId) || addresses[0]
  const isAvatarUploading = isProfileSaving && avatarPreview.startsWith('data:')
  const shouldCollapseOrders = orders.length > ORDER_HISTORY_COLLAPSED_LIMIT
  const visibleOrders = shouldCollapseOrders && !isOrderHistoryExpanded
    ? orders.slice(0, ORDER_HISTORY_COLLAPSED_LIMIT)
    : orders
  const hiddenOrderCount = Math.max(orders.length - ORDER_HISTORY_COLLAPSED_LIMIT, 0)

  function revealHiddenOrderTarget(targetId: string) {
    const orderIndex = orders.findIndex((orderItem) => getOrderTargetId(orderItem.id) === targetId)
    if (orderIndex >= ORDER_HISTORY_COLLAPSED_LIMIT) {
      setIsOrderHistoryExpanded(true)
      return true
    }

    return false
  }

  useEffect(() => {
    const targetId = getAccountTargetId(location.search)
    if (!targetId) return undefined
    const expandedForTarget = revealHiddenOrderTarget(targetId)

    const scrollTimer = window.setTimeout(() => {
      const target = document.getElementById(targetId)
      if (!target) return

      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightTargetId(targetId)
    }, expandedForTarget ? 260 : 160)

    const highlightTimer = window.setTimeout(() => {
      setHighlightTargetId((current) => (current === targetId ? '' : current))
    }, 4800)

    return () => {
      window.clearTimeout(scrollTimer)
      window.clearTimeout(highlightTimer)
    }
  }, [contacts, location.search, orders])

  useEffect(() => {
    function handleAccountTarget(event: Event) {
      const targetEvent = event as CustomEvent<{ search?: string }>
      const targetId = getAccountTargetId(targetEvent.detail?.search || '')
      if (!targetId) return

      const expandedForTarget = revealHiddenOrderTarget(targetId)

      window.setTimeout(() => {
        const target = document.getElementById(targetId)
        if (!target) return

        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlightTargetId(targetId)
        window.setTimeout(() => {
          setHighlightTargetId((current) => (current === targetId ? '' : current))
        }, 4800)
      }, expandedForTarget ? 180 : 0)
    }

    window.addEventListener('marseille04:account-target', handleAccountTarget)

    return () => {
      window.removeEventListener('marseille04:account-target', handleAccountTarget)
    }
  }, [contacts, orders])

  function updateAddress(addressId: string, field: keyof ShippingAddress, value: string) {
    setAddresses((current) => current.map((item) => (item.id === addressId ? { ...item, [field]: value } : item)))
  }

  function addAddress() {
    setAddresses((current) => {
      const nextAddress = createAddress(current.length)
      setSelectedAddressId(nextAddress.id)
      return [...current, nextAddress]
    })
  }

  function removeAddress(addressId: string) {
    setAddresses((current) => {
      if (current.length <= 1) return current
      const next = current.filter((item) => item.id !== addressId)
      if (selectedAddressId === addressId) {
        setSelectedAddressId(next[0]?.id || '')
      }
      return next
    })
  }

  function cancelProfileEdit() {
    if (isProfileSaving) return

    setAddresses(initialAddresses)
    setSelectedAddressId(user?.selectedAddressId || initialAddresses[0]?.id || '')
    setAvatarPreview(user?.avatar || '')
    setAvatarError('')
    setIsEditingProfile(false)
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    if (isProfileSaving) return

    const file = event.target.files?.[0]
    if (!file) return

    if (!AVATAR_TYPES.includes(file.type) || file.size > MAX_AVATAR_BYTES) {
      event.target.value = ''
      setAvatarError(t('account.avatarTooLarge'))
      return
    }

    try {
      setAvatarPreview(await readFileAsDataUrl(file))
      setAvatarError('')
    } catch {
      setAvatarError(t('account.avatarReadError'))
    }
  }

  function removeAvatar() {
    if (isProfileSaving) return

    setAvatarPreview('')
    setAvatarError('')
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isProfileSaving) return

    const formData = new FormData(event.currentTarget)
    const result = createProfileSchema(t).safeParse({
      email: formData.get('email'),
      name: formData.get('name'),
      phone: formData.get('phone'),
      selectedAddress: {
        address: selectedAddress?.address || '',
      },
    })

    if (!result.success) {
      setProfileErrors(
        result.error.issues.reduce((errors, issue) => ({
          ...errors,
          [issue.path.join('.')]: issue.message,
        }), {}),
      )
      return
    }

    setProfileErrors({})
    setIsProfileSaving(true)
    try {
      const saved = await onSubmitProfile(event)
      if (saved !== false) {
        setIsEditingProfile(false)
      }
    } finally {
      setIsProfileSaving(false)
    }
  }

  if (!user) {
    return (
      <CustomerEmptyState
        title={t('account.emptyTitle')}
        description={t('account.emptyDescription')}
        icon={<LogIn size={24} />}
        action={(
          <button className={customerPrimaryButtonClass} onClick={onLogin}>
            <LogIn size={17} />
            {t('auth.login')}
          </button>
        )}
      />
    )
  }

  return (
    <section className="grid gap-8">
      <div className={`${customerSoftPanelClass} flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="grid gap-3">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primaryDark"><User size={15} /> {t('account.title')}</p>
          <h1>{t('account.greeting', { name: user.name })}</h1>
          <p className="max-w-3xl text-base font-semibold leading-7 text-muted">{t('account.subtitle')}</p>
        </div>
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary/10 text-2xl font-black text-primaryDark shadow-soft" aria-hidden="true">
          {user.avatar ? <img className="h-full w-full object-cover" src={user.avatar} alt="" /> : getAvatarFallback(user)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {isEditingProfile ? (
          <form className={`${customerPanelClass} grid gap-4`} onSubmit={handleProfileSubmit}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2>{t('account.profile')}</h2>
              <button type="button" className={customerSecondaryButtonClass} onClick={cancelProfileEdit} disabled={isProfileSaving} aria-label={t('account.cancelEdit')}>
                <X size={17} />
                {t('account.cancelEdit')}
              </button>
            </div>
            <div className="grid gap-4 rounded-md border border-lineStrong/50 bg-sky-50 p-4 shadow-soft md:grid-cols-[128px_1fr]">
              <div className={`relative flex size-28 items-center justify-center overflow-hidden rounded-full border border-line bg-surfaceMuted text-2xl font-black text-primaryDark shadow-soft ${isAvatarUploading ? 'opacity-80 ring-4 ring-primary/20' : ''}`} aria-hidden="true">
                {avatarPreview ? <img className="h-full w-full object-cover" src={avatarPreview} alt="" /> : <span>{getAvatarFallback(user)}</span>}
                {isAvatarUploading && (
                  <div className="absolute inset-0 grid place-items-center bg-white/80 text-sm font-black text-primaryDark backdrop-blur">
                    <LoaderCircle size={24} />
                  </div>
                )}
              </div>
              <div>
                <span>{t('account.avatar')}</span>
                <p>{t('account.avatarHelp')}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`${customerPrimaryButtonClass} cursor-pointer ${isProfileSaving ? 'pointer-events-none opacity-50' : ''}`}>
                    <ImagePlus size={15} />
                    {t('account.changeAvatar')}
                    <input
                      className="hidden"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      disabled={isProfileSaving}
                    />
                  </label>
                  {avatarPreview && (
                    <button type="button" className={customerDangerButtonClass} onClick={removeAvatar} disabled={isProfileSaving}>
                      <Trash2 size={15} />
                      {t('account.removeAvatar')}
                    </button>
                  )}
                </div>
                {isAvatarUploading && (
                  <div className="text-sm font-bold text-muted" role="status" aria-live="polite">
                    <UploadCloud size={17} />
                    <div>
                      <strong>{t('account.uploadingAvatar')}</strong>
                      <p>{t('account.uploadingAvatarText')}</p>
                      <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-primary/20" aria-hidden="true">
                        <i />
                      </div>
                    </div>
                  </div>
                )}
                {avatarError && <strong className="text-red-700">{avatarError}</strong>}
              </div>
              <input type="hidden" name="avatar" value={avatarPreview} />
            </div>
            <label>
              {t('auth.name')}
              <input aria-invalid={getAriaInvalid(profileErrors.name)} name="name" defaultValue={user.name} required />
              <FieldError error={profileErrors.name} />
            </label>
            <label>
              Email
              <input aria-invalid={getAriaInvalid(profileErrors.email)} name="email" type="email" defaultValue={user.email} required />
              <FieldError error={profileErrors.email} />
            </label>
            <label>
              {t('contact.phone')}
              <input aria-invalid={getAriaInvalid(profileErrors.phone)} name="phone" defaultValue={user.phone || ''} placeholder="090..." />
              <FieldError error={profileErrors.phone} />
            </label>
            <label>
              {t('account.selectedAddress')}
              <select value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)}>
                {addresses.map((item) => (
                  <option key={item.id} value={item.id}>{item.label || item.address || t('account.address')}</option>
                ))}
              </select>
            </label>
            <input type="hidden" name="address" value={selectedAddress?.address || ''} />
            <input type="hidden" name="selectedAddressId" value={selectedAddressId} />
            <input type="hidden" name="shippingAddresses" value={JSON.stringify(addresses)} />
            <div className="grid gap-4 rounded-md border border-lineStrong/50 bg-white p-4 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><MapPin size={15} /> {t('account.shippingAddresses')}</span>
                <button type="button" className={customerSecondaryButtonClass} onClick={addAddress}><Plus size={15} /> {t('account.addAddress')}</button>
              </div>
              {addresses.map((item) => (
                <article className={`grid gap-3 rounded-md border p-3 shadow-soft ${item.id === selectedAddressId ? 'border-primary bg-primary/10 text-primaryDark' : 'border-line bg-surfaceMuted'}`} key={item.id}>
                  <label>
                    {t('account.addressLabel')}
                    <input value={item.label} onChange={(event) => updateAddress(item.id, 'label', event.target.value)} />
                  </label>
                  <label>
                    {t('account.recipient')}
                    <input value={item.recipient} onChange={(event) => updateAddress(item.id, 'recipient', event.target.value)} />
                  </label>
                  <label>
                    {t('contact.phone')}
                    <input value={item.phone} onChange={(event) => updateAddress(item.id, 'phone', event.target.value)} placeholder="090..." />
                  </label>
                  <label>
                    {t('account.address')}
                    <textarea
                      aria-invalid={getAriaInvalid(item.id === selectedAddressId ? profileErrors['selectedAddress.address'] : '')}
                      value={item.address}
                      onChange={(event) => updateAddress(item.id, 'address', event.target.value)}
                      placeholder={t('checkout.addressPlaceholder')}
                      required={item.id === selectedAddressId}
                    />
                    {item.id === selectedAddressId && <FieldError error={profileErrors['selectedAddress.address']} />}
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className={customerSecondaryButtonClass} onClick={() => setSelectedAddressId(item.id)}>{item.id === selectedAddressId ? t('account.addressSelected') : t('account.useAddress')}</button>
                    {addresses.length > 1 && (
                      <button type="button" className={customerDangerButtonClass} onClick={() => removeAddress(item.id)}>
                        <Trash2 size={15} />
                        {t('cart.remove')}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <button className={customerPrimaryButtonClass} disabled={isProfileSaving}>
              {isProfileSaving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
              {isProfileSaving ? t('account.savingProfile') : t('common.save')}
            </button>
          </form>
        ) : (
          <section className={`${customerPanelClass} grid gap-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-1">
                <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primaryDark">
                  <User size={15} />
                  {t('account.profile')}
                </p>
                <h2>{user.name}</h2>
              </div>
              <button type="button" className={customerSecondaryButtonClass} onClick={() => setIsEditingProfile(true)}>
                <Pencil size={17} />
                {t('account.editProfile')}
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[240px_1fr]">
              <article className="grid place-items-center gap-3 rounded-md border border-lineStrong/50 bg-gradient-to-br from-white via-sky-50 to-rose-50 p-5 text-center shadow-soft">
                <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary/10 text-3xl font-black text-primaryDark shadow-liquid" aria-hidden="true">
                  {user.avatar ? <img className="h-full w-full object-cover" src={user.avatar} alt="" /> : getAvatarFallback(user)}
                </div>
                <div className="grid gap-1">
                  <strong className="text-xl font-black text-ink">{user.name}</strong>
                  <span className={customerMutedPillClass}>{t('account.member')}</span>
                </div>
              </article>

              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="flex min-w-0 items-start gap-3 rounded-md border border-line bg-white p-4 shadow-soft">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primaryDark"><Mail size={18} /></span>
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase text-primaryDark">Email</span>
                      <strong className="block break-all text-base font-black text-ink">{user.email}</strong>
                    </div>
                  </article>
                  <article className="flex min-w-0 items-start gap-3 rounded-md border border-line bg-white p-4 shadow-soft">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primaryDark"><Phone size={18} /></span>
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase text-primaryDark">{t('contact.phone')}</span>
                      <strong className="block text-base font-black text-ink">{user.phone || t('admin.noInfo')}</strong>
                    </div>
                  </article>
                </div>

                <article className="grid gap-3 rounded-md border border-primary/20 bg-primary/5 p-4 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark">
                      <MapPin size={15} />
                      {t('account.selectedAddress')}
                    </span>
                    <span className={customerMutedPillClass}>{selectedAddress?.label || t('account.address')}</span>
                  </div>
                  <div className="grid gap-1 text-sm font-semibold leading-6 text-muted">
                    <strong className="text-base font-black text-ink">{selectedAddress?.recipient || user.name}</strong>
                    <span>{selectedAddress?.phone || user.phone || t('admin.noInfo')}</span>
                    <span>{selectedAddress?.address || t('admin.noInfo')}</span>
                  </div>
                </article>
              </div>
            </div>

            <div className="grid gap-4 rounded-md border border-lineStrong/50 bg-sky-50 p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><MapPin size={15} /> {t('account.shippingAddresses')}</span>
                <strong className={customerMutedPillClass}>{t('account.addressCount', { count: addresses.length })}</strong>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {addresses.map((item) => (
                  <article className={`grid gap-2 rounded-md border bg-white p-4 shadow-soft ${item.id === selectedAddressId ? 'border-primary text-primaryDark ring-4 ring-primary/10' : 'border-line text-ink'}`} key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="font-black">{item.label || t('account.address')}</strong>
                      {item.id === selectedAddressId ? <span className={customerMutedPillClass}>{t('account.addressSelected')}</span> : null}
                    </div>
                    <p className="text-sm font-semibold text-muted">{item.recipient || user.name} · {item.phone || user.phone || t('admin.noInfo')}</p>
                    <p className="text-sm font-semibold leading-6 text-muted">{item.address || t('admin.noInfo')}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <aside className="h-fit grid gap-4">
          <article className={customerCardClass}>
            <ShoppingCart size={22} />
            <span className="text-xs font-black uppercase text-primaryDark">{t('account.cart')}</span>
            <strong className="text-lg font-black text-ink">{t('account.cartCount', { count: cartCount })}</strong>
            <p className="text-sm font-semibold text-muted">{t('order.subtotal')}: {formatCurrency(totalInCart)}</p>
          </article>
          <article className={customerCardClass}>
            <PackageCheck size={22} />
            <span className="text-xs font-black uppercase text-primaryDark">{t('account.latestOrder')}</span>
            {latestOrder ? (
              <>
                <strong className="break-all text-lg font-black text-ink">{latestOrder.id}</strong>
                <p className="text-sm font-semibold text-muted">{latestOrder.payment}</p>
                <p className="text-base font-black text-primaryDark">{formatCurrency(latestOrder.total)}</p>
              </>
            ) : (
              <>
                <strong className="text-lg font-black text-ink">{t('account.noOrder')}</strong>
                <p className="text-sm font-semibold text-muted">{t('account.noOrderText')}</p>
              </>
            )}
          </article>
          <article className={customerCardClass}>
            <BadgeCheck size={22} />
            <span className="text-xs font-black uppercase text-primaryDark">{t('account.member')}</span>
            <strong className="text-lg font-black text-ink">Member</strong>
            <p className="text-sm font-semibold text-muted">{t('account.memberText')}</p>
          </article>
        </aside>
      </div>

      <section className={`${customerPanelClass} grid gap-4`} id="account-order-history">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><History size={15} /> {t('account.history')}</p>
            <h2>{t('account.ordersTitle')}</h2>
          </div>
          <span className={customerMutedPillClass}>{t('account.historyCount', { count: orders.length })}</span>
        </div>

        {ordersLoading ? (
          <div className="grid gap-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <article className="order-history-card grid gap-4 rounded-md border border-lineStrong/50 bg-white p-4 shadow-soft" key={`order-loading-${index}`} aria-hidden="true">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                  <span className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
                  <span className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
                  <span className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="grid gap-2">
                  <span className="h-14 w-full animate-pulse rounded-md bg-slate-200" />
                  <span className="h-14 w-full animate-pulse rounded-md bg-slate-200" />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <span className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                  <strong className="h-5 w-28 animate-pulse rounded-full bg-slate-200" />
                </div>
              </article>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <CustomerEmptyState title={t('account.historyEmpty')} description={t('account.historyEmptyText')} icon={<PackageCheck size={24} />} />
        ) : (
          <div className="grid gap-3">
            {visibleOrders.map((orderItem) => {
              const targetId = getOrderTargetId(orderItem.id)
              return (
              <article
                className={`order-history-card grid gap-4 rounded-md border border-lineStrong/50 bg-white p-4 shadow-soft transition ${highlightTargetId === targetId ? 'border-primary ring-4 ring-primary/10' : ''}`.trim()}
                id={targetId}
                key={orderItem.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-1">
                    <span className="text-xs font-black uppercase text-primaryDark">{t('account.orderCode')}</span>
                    <strong className="break-all text-lg font-black text-ink">{orderItem.id}</strong>
                  </div>
                  <div className="inline-flex w-fit items-center rounded-full border border-line bg-surfaceMuted px-3 py-1 text-xs font-black text-primaryDark">{orderItem.status || 'confirmed'}</div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-muted">
                  <span className={customerMutedPillClass}><CalendarDays size={15} /> {formatOrderDate(orderItem.createdAt)}</span>
                  <span className={customerMutedPillClass}>{t('account.cartCount', { count: orderItem.items?.length || 0 })}</span>
                  <span className={customerMutedPillClass}>{orderItem.payment}</span>
                </div>

                <div className="grid gap-2">
                  {(orderItem.items || []).slice(0, 3).map((item, index) => (
                    <div key={`${orderItem.id}-${item.productId || item.name || 'item'}-${index}`} className="grid gap-3 rounded-md border border-line bg-surfaceMuted p-3 sm:grid-cols-[56px_1fr_auto] sm:items-center">
                      <img className="size-14 rounded-md border border-line object-cover" src={item.image} alt={item.name} />
                      <div className="min-w-0">
                        <strong className="line-clamp-2 font-black text-ink">{item.name}</strong>
                        <p className="text-sm font-semibold text-muted">{item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                  {(orderItem.items?.length || 0) > 3 && <p className="text-sm font-bold text-muted">+{t('account.cartCount', { count: (orderItem.items?.length || 0) - 3 })}</p>}
                </div>

                <div className="order-history-total flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <span className="text-sm font-black text-muted">{t('account.totalPaid')}</span>
                  <strong className="text-xl font-black text-primaryDark">{formatCurrency(orderItem.total)}</strong>
                </div>
              </article>
              )
            })}
            {shouldCollapseOrders ? (
              <button
                type="button"
                className={`${customerSecondaryButtonClass} mx-auto w-fit`}
                onClick={() => setIsOrderHistoryExpanded((current) => !current)}
              >
                {isOrderHistoryExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                {isOrderHistoryExpanded
                  ? t('account.collapseOrders')
                  : t('account.showMoreOrders', { count: hiddenOrderCount })}
              </button>
            ) : null}
          </div>
        )}
      </section>

      <section className={`${customerPanelClass} grid gap-4`} id="account-support-history">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><MessageSquare size={15} /> {t('account.supportHistory')}</p>
            <h2>{t('account.supportTitle')}</h2>
          </div>
          <span className={customerMutedPillClass}>{t('account.supportCount', { count: contacts.length })}</span>
        </div>

        {contactsLoading ? (
          <div className="grid gap-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <article className="grid gap-3 rounded-md border border-lineStrong/50 bg-white p-4 shadow-soft" key={`contact-loading-${index}`} aria-hidden="true">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-2">
                    <span className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                    <span className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <span className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                </div>
                <span className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                <span className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
                  <span className="h-4 w-44 animate-pulse rounded-full bg-slate-200" />
                </div>
              </article>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <CustomerEmptyState title={t('account.supportEmpty')} description={t('account.supportEmptyText')} icon={<MessageSquare size={24} />} />
        ) : (
          <div className="grid gap-3">
            {contacts.map((contact) => {
              const targetId = getContactTargetId(contact.id)
              return (
                <article
                  className={`grid gap-3 rounded-md border border-lineStrong/50 bg-white p-4 shadow-soft ${highlightTargetId === targetId ? 'border-primary ring-4 ring-primary/10' : ''}`.trim()}
                  id={targetId}
                  key={contact.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid gap-1">
                      <span className="text-xs font-black uppercase text-primaryDark">{t('contact.topic')}</span>
                      <strong className="text-lg font-black text-ink">{contact.topic}</strong>
                    </div>
                    <div className="inline-flex w-fit items-center rounded-full border border-line bg-surfaceMuted px-3 py-1 text-xs font-black text-primaryDark">{t(contactStatusLabelKeys[contact.status || ''] || 'admin.contactStatus.new')}</div>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-muted">{contact.message}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={customerMutedPillClass}><CalendarDays size={15} /> {formatOrderDate(contact.createdAt)}</span>
                    <span className={customerMutedPillClass}>{contact.email}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}

export default AccountPage
