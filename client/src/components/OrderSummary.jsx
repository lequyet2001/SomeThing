import { formatCurrency } from '../utils/currency'
import { CreditCard, Receipt } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

function OrderSummary({ subtotal, shipping, total, onCheckout }) {
  const { t } = useLanguage()

  return (
    <aside className="order-summary">
      <h2><Receipt size={22} /> {t('order.summary')}</h2>
      <div><span>{t('order.subtotal')}</span><strong>{formatCurrency(subtotal)}</strong></div>
      <div><span>{t('order.shipping')}</span><strong>{shipping === 0 ? t('common.free') : formatCurrency(shipping)}</strong></div>
      <div className="total-line"><span>{t('order.total')}</span><strong>{formatCurrency(total)}</strong></div>
      <button className="primary-action" onClick={onCheckout} disabled={subtotal === 0}>
        <CreditCard size={17} /> {t('order.checkout')}
      </button>
    </aside>
  )
}

export default OrderSummary
