import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import OrderSummary from '../components/OrderSummary'
import {
  CustomerEmptyState,
  CustomerSectionHeader,
  customerDangerButtonClass,
  customerMutedPillClass,
  customerPanelClass,
} from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import type { CartLine, EntityId } from '../types/shop'
import { formatCurrency } from '../utils/currency'

function CartPage({
  cartLines,
  subtotal,
  shipping,
  total,
  onCheckout,
  onRemove,
  onUpdateQuantity,
}: {
  cartLines: CartLine[]
  subtotal: number
  shipping: number
  total: number
  onCheckout: () => void
  onRemove: (productId: EntityId) => void
  onUpdateQuantity: (productId: EntityId, quantity: number) => void
}) {
  const { t } = useLanguage()

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        <CustomerSectionHeader
          eyebrow={<><ShoppingCart size={15} /> {t('account.cart')}</>}
          title={t('cart.title')}
          meta={<span className={customerMutedPillClass}>{t('account.cartCount', { count: cartLines.length })}</span>}
        />
        {cartLines.length === 0 ? (
          <CustomerEmptyState title={t('cart.empty')} icon={<ShoppingCart size={24} />} />
        ) : (
          <div className="grid gap-3">
            {cartLines.map((item) => (
              <article className={`${customerPanelClass} grid gap-4 p-3 md:p-3 sm:grid-cols-[96px_1fr_auto_auto] sm:items-center`} key={item.productId}>
                <img className="aspect-square w-full rounded-md border border-line object-cover sm:w-24" src={item.product.image} alt={item.product.name} />
                <div className="grid min-w-0 gap-1">
                  <h2 className="line-clamp-2 text-lg font-black text-ink">{item.product.name}</h2>
                  <p className="text-base font-black text-primaryDark">{formatCurrency(item.product.price)}</p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-md border border-lineStrong/60 bg-white p-1 shadow-soft">
                  <button className="size-9 min-h-0 px-0" aria-label={t('cart.decrease')} onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}><Minus size={16} /></button>
                  <span className="min-w-8 text-center font-black text-ink">{item.quantity}</span>
                  <button className="size-9 min-h-0 px-0" aria-label={t('cart.increase')} onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}><Plus size={16} /></button>
                </div>
                <button className={customerDangerButtonClass} onClick={() => onRemove(item.productId)}>
                  <Trash2 size={16} />
                  {t('cart.remove')}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
      <OrderSummary subtotal={subtotal} shipping={shipping} total={total} onCheckout={onCheckout} />
    </section>
  )
}

export default CartPage
