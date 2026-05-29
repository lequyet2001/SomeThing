import OrderSummary from '../components/OrderSummary'
import { CreditCard, Mail, MapPin, Send, User } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

function CheckoutPage({ cartLines, subtotal, shipping, total, user, onSubmitCheckout }) {
  const { t } = useLanguage()

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
          <span><MapPin size={15} /> {t('checkout.address')}</span>
          <input name="address" required placeholder={t('checkout.addressPlaceholder')} />
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
