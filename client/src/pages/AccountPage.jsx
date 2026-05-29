import { formatCurrency } from '../utils/currency'
import { BadgeCheck, CalendarDays, History, LogIn, PackageCheck, Save, ShoppingCart, User } from 'lucide-react'
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

function AccountPage({ cartCount, lastOrder, orders = [], totalInCart, user, onLogin, onSubmitProfile }) {
  const { t } = useLanguage()
  const latestOrder = lastOrder || orders[0]

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
        <form className="account-form" onSubmit={onSubmitProfile}>
          <h2>{t('account.profile')}</h2>
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
            {t('account.address')}
            <textarea name="address" defaultValue={user.address || ''} placeholder={t('checkout.addressPlaceholder')} />
          </label>
          <button className="primary-action"><Save size={17} /> {t('common.save')}</button>
        </form>

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
