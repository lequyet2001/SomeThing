import { formatCurrency } from '../utils/currency'
import { useLanguage } from '../i18n/LanguageContext'

function PaymentPage({ order, onContinue }) {
  const { t } = useLanguage()

  return (
    <section className="payment-state">
      <h1>{t('payment.success')}</h1>
      <p>{t('payment.orderCode')}: <strong>{order?.id}</strong></p>
      <p>{t('payment.method')}: {order?.payment}</p>
      <p>{t('payment.total')}: <strong>{formatCurrency(order?.total || 0)}</strong></p>
      <button className="primary-action" onClick={onContinue}>{t('payment.continue')}</button>
    </section>
  )
}

export default PaymentPage
