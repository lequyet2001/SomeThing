import OrderSummary from '../components/OrderSummary'
import { formatCurrency } from '../utils/currency'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

function CartPage({ cartLines, subtotal, shipping, total, onCheckout, onRemove, onUpdateQuantity }) {
  const { t } = useLanguage()

  return (
    <section className="cart-layout">
      <div>
        <h1><ShoppingCart size={30} /> {t('cart.title')}</h1>
        {cartLines.length === 0 ? (
          <div className="empty-state">{t('cart.empty')}</div>
        ) : (
          <div className="cart-list">
            {cartLines.map((item) => (
              <article className="cart-item" key={item.productId}>
                <img src={item.product.image} alt={item.product.name} />
                <div>
                  <h2>{item.product.name}</h2>
                  <p>{formatCurrency(item.product.price)}</p>
                </div>
                <div className="quantity-control">
                  <button aria-label={t('cart.decrease')} onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}><Minus size={16} /></button>
                  <span>{item.quantity}</span>
                  <button aria-label={t('cart.increase')} onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}><Plus size={16} /></button>
                </div>
                <button className="remove-button" onClick={() => onRemove(item.productId)}><Trash2 size={16} /> {t('cart.remove')}</button>
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
