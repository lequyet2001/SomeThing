import { formatCurrency } from '../utils/currency'
import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CalendarDays, History, ImagePlus, LoaderCircle, LogIn, MapPin, MessageSquare, PackageCheck, Pencil, Plus, Save, ShoppingCart, Trash2, UploadCloud, User, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

function formatOrderDate(value) {
  if (!value) return 'Moi tao'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function createAddress(index = 0) {
  return {
    id: `address-${Date.now()}-${index}`,
    label: index === 0 ? 'Mặc định' : `Địa chỉ ${index + 1}`,
    recipient: '',
    phone: '',
    address: '',
  }
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const contactStatusLabelKeys = {
  done: 'admin.contactStatus.done',
  new: 'admin.contactStatus.new',
  processing: 'admin.contactStatus.processing',
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result))
    reader.addEventListener('error', () => reject(new Error('Không đọc được ảnh.')))
    reader.readAsDataURL(file)
  })
}

function getAvatarFallback(user) {
  return user?.name?.slice(0, 1).toUpperCase() || '?'
}

function toElementSafeId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-')
}

function getOrderTargetId(orderId) {
  return `account-order-${toElementSafeId(orderId)}`
}

function getContactTargetId(contactId) {
  return `account-contact-${toElementSafeId(contactId)}`
}

function getAccountTargetId(search) {
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

function normalizeAddresses(user) {
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

function AccountPage({ cartCount, contacts = [], lastOrder, orders = [], totalInCart, user, onLogin, onSubmitProfile }) {
  const { t } = useLanguage()
  const location = useLocation()
  const latestOrder = lastOrder || orders[0]
  const initialAddresses = useMemo(() => normalizeAddresses(user), [user])
  const [addresses, setAddresses] = useState(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState(user?.selectedAddressId || initialAddresses[0]?.id || '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [avatarError, setAvatarError] = useState('')
  const [highlightTargetId, setHighlightTargetId] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  useEffect(() => {
    setAddresses(initialAddresses)
    setSelectedAddressId(user?.selectedAddressId || initialAddresses[0]?.id || '')
    setAvatarPreview(user?.avatar || '')
    setAvatarError('')
    setIsEditingProfile(false)
    setIsProfileSaving(false)
  }, [initialAddresses, user?.avatar, user?.selectedAddressId])

  const selectedAddress = addresses.find((item) => item.id === selectedAddressId) || addresses[0]
  const isAvatarUploading = isProfileSaving && avatarPreview.startsWith('data:')

  useEffect(() => {
    const targetId = getAccountTargetId(location.search)
    if (!targetId) return undefined

    const scrollTimer = window.setTimeout(() => {
      const target = document.getElementById(targetId)
      if (!target) return

      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightTargetId(targetId)
    }, 160)

    const highlightTimer = window.setTimeout(() => {
      setHighlightTargetId((current) => (current === targetId ? '' : current))
    }, 4800)

    return () => {
      window.clearTimeout(scrollTimer)
      window.clearTimeout(highlightTimer)
    }
  }, [contacts, location.search, orders])

  useEffect(() => {
    function handleAccountTarget(event) {
      const targetId = getAccountTargetId(event.detail?.search || '')
      if (!targetId) return

      const target = document.getElementById(targetId)
      if (!target) return

      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightTargetId(targetId)
      window.setTimeout(() => {
        setHighlightTargetId((current) => (current === targetId ? '' : current))
      }, 4800)
    }

    window.addEventListener('marseille04:account-target', handleAccountTarget)

    return () => {
      window.removeEventListener('marseille04:account-target', handleAccountTarget)
    }
  }, [contacts, orders])

  function updateAddress(addressId, field, value) {
    setAddresses((current) => current.map((item) => (item.id === addressId ? { ...item, [field]: value } : item)))
  }

  function addAddress() {
    setAddresses((current) => {
      const nextAddress = createAddress(current.length)
      setSelectedAddressId(nextAddress.id)
      return [...current, nextAddress]
    })
  }

  function removeAddress(addressId) {
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

  async function handleAvatarChange(event) {
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

  async function handleProfileSubmit(event) {
    event.preventDefault()
    if (isProfileSaving) return

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
      <section className="account-empty">
        <p className="account-kicker">{t('account.kicker')}</p>
        <h1>{t('account.emptyTitle')}</h1>
        <p>{t('account.emptyDescription')}</p>
        <button className="primary-action" onClick={onLogin}><LogIn size={17} /> {t('auth.login')}</button>
      </section>
    )
  }

  return (
    <section className="account-page">
      <div className="account-hero">
        <div>
          <p className="account-kicker"><User size={15} /> {t('account.title')}</p>
          <h1>{t('account.greeting', { name: user.name })}</h1>
          <p>{t('account.subtitle')}</p>
        </div>
        <div className="account-avatar" aria-hidden="true">
          {user.avatar ? <img src={user.avatar} alt="" /> : getAvatarFallback(user)}
        </div>
      </div>

      <div className="account-layout">
        {isEditingProfile ? (
          <form className="account-form" onSubmit={handleProfileSubmit}>
            <div className="account-form-heading">
              <h2>{t('account.profile')}</h2>
              <button type="button" onClick={cancelProfileEdit} disabled={isProfileSaving} aria-label={t('account.cancelEdit')}>
                <X size={17} />
                {t('account.cancelEdit')}
              </button>
            </div>
            <div className="account-avatar-field">
              <div className={`account-avatar-preview${isAvatarUploading ? ' is-uploading' : ''}`} aria-hidden="true">
                {avatarPreview ? <img src={avatarPreview} alt="" /> : <span>{getAvatarFallback(user)}</span>}
                {isAvatarUploading && (
                  <div className="avatar-upload-overlay">
                    <LoaderCircle size={24} />
                  </div>
                )}
              </div>
              <div>
                <span>{t('account.avatar')}</span>
                <p>{t('account.avatarHelp')}</p>
                <div className="avatar-actions">
                  <label className={`avatar-file-button${isProfileSaving ? ' is-disabled' : ''}`}>
                    <ImagePlus size={15} />
                    {t('account.changeAvatar')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      disabled={isProfileSaving}
                    />
                  </label>
                  {avatarPreview && (
                    <button type="button" className="avatar-remove" onClick={removeAvatar} disabled={isProfileSaving}>
                      <Trash2 size={15} />
                      {t('account.removeAvatar')}
                    </button>
                  )}
                </div>
                {isAvatarUploading && (
                  <div className="account-upload-status" role="status" aria-live="polite">
                    <UploadCloud size={17} />
                    <div>
                      <strong>{t('account.uploadingAvatar')}</strong>
                      <p>{t('account.uploadingAvatarText')}</p>
                      <div className="upload-progress" aria-hidden="true">
                        <i />
                      </div>
                    </div>
                  </div>
                )}
                {avatarError && <strong className="account-avatar-error">{avatarError}</strong>}
              </div>
              <input type="hidden" name="avatar" value={avatarPreview} />
            </div>
            <label>
              {t('auth.name')}
              <input name="name" defaultValue={user.name} required />
            </label>
            <label>
              Email
              <input name="email" type="email" defaultValue={user.email} required />
            </label>
            <label>
              {t('contact.phone')}
              <input name="phone" defaultValue={user.phone || ''} placeholder="090..." />
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
            <div className="address-manager">
              <div className="address-manager-heading">
                <span><MapPin size={15} /> {t('account.shippingAddresses')}</span>
                <button type="button" onClick={addAddress}><Plus size={15} /> {t('account.addAddress')}</button>
              </div>
              {addresses.map((item) => (
                <article className={item.id === selectedAddressId ? 'is-selected' : ''} key={item.id}>
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
                    <textarea value={item.address} onChange={(event) => updateAddress(item.id, 'address', event.target.value)} placeholder={t('checkout.addressPlaceholder')} required={item.id === selectedAddressId} />
                  </label>
                  <div className="address-actions">
                    <button type="button" onClick={() => setSelectedAddressId(item.id)}>{item.id === selectedAddressId ? t('account.addressSelected') : t('account.useAddress')}</button>
                    {addresses.length > 1 && (
                      <button type="button" className="danger" onClick={() => removeAddress(item.id)}>
                        <Trash2 size={15} />
                        {t('cart.remove')}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <button className="primary-action" disabled={isProfileSaving}>
              {isProfileSaving ? <LoaderCircle className="button-spinner" size={17} /> : <Save size={17} />}
              {isProfileSaving ? t('account.savingProfile') : t('common.save')}
            </button>
          </form>
        ) : (
          <section className="account-profile-card">
            <div className="account-profile-heading">
              <h2>{t('account.profile')}</h2>
              <button type="button" onClick={() => setIsEditingProfile(true)}>
                <Pencil size={17} />
                {t('account.editProfile')}
              </button>
            </div>
            <div className="account-profile-grid">
              <article>
                <span>{t('auth.name')}</span>
                <strong>{user.name}</strong>
              </article>
              <article>
                <span>Email</span>
                <strong>{user.email}</strong>
              </article>
              <article>
                <span>{t('contact.phone')}</span>
                <strong>{user.phone || t('admin.noInfo')}</strong>
              </article>
              <article>
                <span>{t('account.selectedAddress')}</span>
                <strong>{selectedAddress?.label || t('account.address')}</strong>
                <p>{selectedAddress?.address || t('admin.noInfo')}</p>
              </article>
            </div>
            <div className="account-address-preview">
              <div>
                <span><MapPin size={15} /> {t('account.shippingAddresses')}</span>
                <strong>{t('account.addressCount', { count: addresses.length })}</strong>
              </div>
              {addresses.map((item) => (
                <article className={item.id === selectedAddressId ? 'is-selected' : ''} key={item.id}>
                  <strong>{item.label || t('account.address')}</strong>
                  <p>{item.recipient || user.name} · {item.phone || user.phone || t('admin.noInfo')}</p>
                  <p>{item.address || t('admin.noInfo')}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <aside className="account-summary">
          <article>
            <ShoppingCart size={22} />
            <span>{t('account.cart')}</span>
            <strong>{t('account.cartCount', { count: cartCount })}</strong>
            <p>{t('order.subtotal')}: {formatCurrency(totalInCart)}</p>
          </article>
          <article>
            <PackageCheck size={22} />
            <span>{t('account.latestOrder')}</span>
            {latestOrder ? (
              <>
                <strong>{latestOrder.id}</strong>
                <p>{latestOrder.payment}</p>
                <p>{formatCurrency(latestOrder.total)}</p>
              </>
            ) : (
              <>
                <strong>{t('account.noOrder')}</strong>
                <p>{t('account.noOrderText')}</p>
              </>
            )}
          </article>
          <article>
            <BadgeCheck size={22} />
            <span>{t('account.member')}</span>
            <strong>Member</strong>
            <p>{t('account.memberText')}</p>
          </article>
        </aside>
      </div>

      <section className="order-history" id="account-order-history">
        <div className="order-history-heading">
          <div>
            <p className="account-kicker"><History size={15} /> {t('account.history')}</p>
            <h2>{t('account.ordersTitle')}</h2>
          </div>
          <span>{t('account.historyCount', { count: orders.length })}</span>
        </div>

        {orders.length === 0 ? (
          <div className="order-history-empty">
            <PackageCheck size={26} />
            <strong>{t('account.historyEmpty')}</strong>
            <p>{t('account.historyEmptyText')}</p>
          </div>
        ) : (
          <div className="order-history-list">
            {orders.map((orderItem) => {
              const targetId = getOrderTargetId(orderItem.id)
              return (
              <article
                className={`order-history-card ${highlightTargetId === targetId ? 'is-notification-target' : ''}`.trim()}
                id={targetId}
                key={orderItem.id}
              >
                <div className="order-history-main">
                  <div>
                    <span>{t('account.orderCode')}</span>
                    <strong>{orderItem.id}</strong>
                  </div>
                  <div className="order-status">{orderItem.status || 'confirmed'}</div>
                </div>

                <div className="order-history-meta">
                  <span><CalendarDays size={15} /> {formatOrderDate(orderItem.createdAt)}</span>
                  <span>{t('account.cartCount', { count: orderItem.items?.length || 0 })}</span>
                  <span>{orderItem.payment}</span>
                </div>

                <div className="order-history-items">
                  {orderItem.items?.slice(0, 3).map((item) => (
                    <div key={`${orderItem.id}-${item.productId}`} className="order-history-product">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                  {orderItem.items?.length > 3 && <p>+{t('account.cartCount', { count: orderItem.items.length - 3 })}</p>}
                </div>

                <div className="order-history-total">
                  <span>{t('account.totalPaid')}</span>
                  <strong>{formatCurrency(orderItem.total)}</strong>
                </div>
              </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="support-history" id="account-support-history">
        <div className="order-history-heading">
          <div>
            <p className="account-kicker"><MessageSquare size={15} /> {t('account.supportHistory')}</p>
            <h2>{t('account.supportTitle')}</h2>
          </div>
          <span>{t('account.supportCount', { count: contacts.length })}</span>
        </div>

        {contacts.length === 0 ? (
          <div className="order-history-empty">
            <MessageSquare size={26} />
            <strong>{t('account.supportEmpty')}</strong>
            <p>{t('account.supportEmptyText')}</p>
          </div>
        ) : (
          <div className="support-history-list">
            {contacts.map((contact) => {
              const targetId = getContactTargetId(contact.id)
              return (
                <article
                  className={`support-history-card ${highlightTargetId === targetId ? 'is-notification-target' : ''}`.trim()}
                  id={targetId}
                  key={contact.id}
                >
                  <div className="support-history-main">
                    <div>
                      <span>{t('contact.topic')}</span>
                      <strong>{contact.topic}</strong>
                    </div>
                    <div className="support-status">{t(contactStatusLabelKeys[contact.status] || 'admin.contactStatus.new')}</div>
                  </div>
                  <p>{contact.message}</p>
                  <div className="order-history-meta">
                    <span><CalendarDays size={15} /> {formatOrderDate(contact.createdAt)}</span>
                    <span>{contact.email}</span>
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
