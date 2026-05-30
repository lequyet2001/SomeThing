import { formatCurrency } from '../utils/currency'
import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CalendarDays, History, LogIn, MapPin, PackageCheck, Pencil, Plus, Save, ShoppingCart, Trash2, User, X } from 'lucide-react'
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

function AccountPage({ cartCount, lastOrder, orders = [], totalInCart, user, onLogin, onSubmitProfile }) {
  const { t } = useLanguage()
  const latestOrder = lastOrder || orders[0]
  const initialAddresses = useMemo(() => normalizeAddresses(user), [user])
  const [addresses, setAddresses] = useState(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState(user?.selectedAddressId || initialAddresses[0]?.id || '')
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  useEffect(() => {
    setAddresses(initialAddresses)
    setSelectedAddressId(user?.selectedAddressId || initialAddresses[0]?.id || '')
    setIsEditingProfile(false)
  }, [initialAddresses, user?.selectedAddressId])

  const selectedAddress = addresses.find((item) => item.id === selectedAddressId) || addresses[0]

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
    setAddresses(initialAddresses)
    setSelectedAddressId(user?.selectedAddressId || initialAddresses[0]?.id || '')
    setIsEditingProfile(false)
  }

  async function handleProfileSubmit(event) {
    await onSubmitProfile(event)
    setIsEditingProfile(false)
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
          {user.name.slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="account-layout">
        {isEditingProfile ? (
          <form className="account-form" onSubmit={handleProfileSubmit}>
            <div className="account-form-heading">
              <h2>{t('account.profile')}</h2>
              <button type="button" onClick={cancelProfileEdit} aria-label={t('account.cancelEdit')}>
                <X size={17} />
                {t('account.cancelEdit')}
              </button>
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
            <button className="primary-action"><Save size={17} /> {t('common.save')}</button>
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

      <section className="order-history">
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
            {orders.map((orderItem) => (
              <article className="order-history-card" key={orderItem.id}>
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
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default AccountPage
