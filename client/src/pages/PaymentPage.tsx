import { formatCurrency } from '../utils/currency'
import { CheckCircle2 } from 'lucide-react'
import { customerPrimaryButtonClass } from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import type { Order } from '../types/shop'

function PaymentPage({ order, onContinue }: { order: Order | null; onContinue: () => void }) {
  const { t } = useLanguage()

  return (
    <section className="mx-auto grid max-w-lg place-items-center gap-4 rounded-md border border-emerald-300 bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-7 text-center shadow-liquid ring-1 ring-white/80">
      <span className="inline-flex size-14 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 shadow-soft">
        <CheckCircle2 size={30} />
      </span>
      <h1>{t('payment.success')}</h1>
      <p className="text-sm font-semibold text-muted">{t('payment.orderCode')}: <strong className="text-ink">{order?.id}</strong></p>
      <p className="text-sm font-semibold text-muted">{t('payment.method')}: <strong className="text-ink">{order?.payment}</strong></p>
      <p className="text-base font-black text-ink">{t('payment.total')}: <strong className="text-primaryDark">{formatCurrency(order?.total || 0)}</strong></p>
      <button className={customerPrimaryButtonClass} onClick={onContinue}>{t('payment.continue')}</button>
    </section>
  )
}

export default PaymentPage
