import { formatCurrency } from '../utils/currency'
import { CreditCard, Receipt } from 'lucide-react'
import { customerMutedPillClass, customerPrimaryButtonClass } from './customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'

function OrderSummary({
  subtotal,
  shipping,
  total,
  onCheckout,
}: {
  subtotal: number
  shipping: number
  total: number
  onCheckout: () => void
}) {
  const { t } = useLanguage()

  return (
    <aside className="grid h-fit gap-4 rounded-md border border-lineStrong/60 bg-white/95 p-5 shadow-liquid ring-1 ring-white/80 lg:sticky lg:top-24">
      <h2 className="flex items-center gap-2 text-xl font-black text-ink"><Receipt size={22} /> {t('order.summary')}</h2>
      <div className="grid gap-3 rounded-md border border-line bg-surfaceMuted p-3">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-muted"><span>{t('order.subtotal')}</span><strong className="text-ink">{formatCurrency(subtotal)}</strong></div>
        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-muted"><span>{t('order.shipping')}</span><strong className={customerMutedPillClass}>{shipping === 0 ? t('common.free') : formatCurrency(shipping)}</strong></div>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-md border border-primary/20 bg-primary/5 p-4 text-base font-black text-ink"><span>{t('order.total')}</span><strong className="text-2xl text-primaryDark">{formatCurrency(total)}</strong></div>
      <button className={customerPrimaryButtonClass} onClick={onCheckout} disabled={subtotal === 0}>
        <CreditCard size={17} /> {t('order.checkout')}
      </button>
    </aside>
  )
}

export default OrderSummary
