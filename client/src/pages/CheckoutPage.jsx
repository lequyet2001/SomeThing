import OrderSummary from '../components/OrderSummary'
import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Mail, MapPin, Send, User } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

function getUserAddresses(user) {
  if (Array.isArray(user?.shippingAddresses) && user.shippingAddresses.length > 0) {
    return user.shippingAddresses
  }

  return user?.address ? [{ id: 'default-address', label: 'Mặc định', recipient: user.name, phone: user.phone || '', address: user.address }] : []
}

function CheckoutPage({ cartLines, subtotal, shipping, total, user, onSubmitCheckout }) {
  const { t } = useLanguage()
  const savedAddresses = useMemo(() => getUserAddresses(user), [user])
  const initialAddress = savedAddresses.find((item) => item.id === user?.selectedAddressId) || savedAddresses[0] || null
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddress?.id || '')
  const [addressValue, setAddressValue] = useState(initialAddress?.address || '')
  const [phoneValue, setPhoneValue] = useState(initialAddress?.phone || user?.phone || '')

  useEffect(() => {
    const nextAddress = savedAddresses.find((item) => item.id === user?.selectedAddressId) || savedAddresses[0] || null
    setSelectedAddressId(nextAddress?.id || '')
    setAddressValue(nextAddress?.address || '')
    setPhoneValue(nextAddress?.phone || user?.phone || '')
  }, [savedAddresses, user?.phone, user?.selectedAddressId])

  function handleSavedAddressChange(addressId) {
    const nextAddress = savedAddresses.find((item) => item.id === addressId)
    setSelectedAddressId(addressId)
    setAddressValue(nextAddress?.address || '')
    setPhoneValue(nextAddress?.phone || user?.phone || '')
  }

  return (
    <section className="checkout-grid">
      <form className="checkout-form" onSubmit={onSubmitCheckout}>
        <h1><CreditCard size={30} /> {t('checkout.title')}</h1>
        <label>
          <span><User size={15} /> {t('auth.name')}</span>
          <input name="name" defaultValue={user?.name || ''} required />
        </label>
        <label>
          <span><Mail size={15} /> Email</span>
          <input name="email" type="email" defaultValue={user?.email || ''} required />
        </label>
        <label>
          <span><User size={15} /> {t('contact.phone')}</span>
          <input name="phone" value={phoneValue} onChange={(event) => setPhoneValue(event.target.value)} placeholder="090..." />
        </label>
        <label>
          <span><MapPin size={15} /> {t('checkout.address')}</span>
          {savedAddresses.length > 0 && (
            <select value={selectedAddressId} onChange={(event) => handleSavedAddressChange(event.target.value)}>
              {savedAddresses.map((item) => (
                <option key={item.id} value={item.id}>{item.label || item.address}</option>
              ))}
            </select>
          )}
          <input
            name="address"
            required
            value={addressValue}
            onChange={(event) => setAddressValue(event.target.value)}
            placeholder={t('checkout.addressPlaceholder')}
          />
        </label>
        <label>
          <span><CreditCard size={15} /> {t('checkout.paymentMethod')}</span>
          <select name="payment">
            <option>{t('checkout.cod')}</option>
            <option>{t('checkout.bank')}</option>
            <option>{t('checkout.card')}</option>
          </select>
        </label>
        <button className="primary-action" disabled={cartLines.length === 0}><Send size={17} /> {t('checkout.order')}</button>
      </form>
      <OrderSummary subtotal={subtotal} shipping={shipping} total={total} onCheckout={() => {}} />
    </section>
  )
}

export default CheckoutPage
