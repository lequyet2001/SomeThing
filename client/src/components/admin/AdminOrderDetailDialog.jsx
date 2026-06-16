import { ClipboardList, PackageSearch, UserRound, X } from 'lucide-react'

import { formatCurrency } from '../../utils/currency'
import { formatAdminDate } from '../../pages/admin/adminUtils'

function getItemTotal(item) {
  return Number(item.price || 0) * Number(item.quantity || 0)
}

function getOrderCustomerType(order) {
  return order?.customerType || (order?.registeredUserId ? 'registered' : 'guest')
}

function AdminOrderDetailDialog({ language, onClose, onOpenCustomer, onOpenProduct, order, t }) {
  if (!order) return null

  const customerType = getOrderCustomerType(order)
  const customerTypeLabel = t(`admin.customerType.${customerType}`)

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section className="admin-dialog admin-order-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
        <div className="admin-order-detail-heading">
          <div>
            <p className="admin-kicker"><ClipboardList size={15} /> {t('admin.orderDetail')}</p>
            <h2 id="order-detail-title">{order.id}</h2>
            <p>{formatAdminDate(order.createdAt, language, t('admin.noInfo'))}</p>
          </div>
          <button type="button" className="admin-icon-button" aria-label={t('admin.close')} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="admin-order-detail-layout">
          <button type="button" className="admin-order-customer-card" onClick={() => onOpenCustomer(order.customer)}>
            <span className="admin-order-detail-icon"><UserRound size={18} /></span>
            <span>
              <strong>{order.customer?.name || t('admin.noInfo')}</strong>
              <small className={`admin-order-customer-type-badge admin-order-customer-type-${customerType}`}>
                {customerTypeLabel}
              </small>
              <small>{order.customer?.email || t('admin.noInfo')}</small>
              <small>{order.customer?.phone || t('admin.noPhone')}</small>
              <small>{order.customer?.address || t('admin.noInfo')}</small>
            </span>
          </button>

          <div className="admin-order-summary-card">
            <div>
              <span>{t('admin.status')}</span>
              <strong>{order.statusLabel || order.status}</strong>
            </div>
            <div>
              <span>{t('admin.customerType')}</span>
              <strong>{customerTypeLabel}</strong>
            </div>
            <div>
              <span>{t('admin.paymentMethod')}</span>
              <strong>{order.payment || t('admin.noInfo')}</strong>
            </div>
            <div>
              <span>{t('admin.subtotal')}</span>
              <strong>{formatCurrency(order.subtotal || 0)}</strong>
            </div>
            <div>
              <span>{t('admin.shippingFee')}</span>
              <strong>{formatCurrency(order.shipping || 0)}</strong>
            </div>
            <div className="admin-order-summary-total">
              <span>{t('admin.total')}</span>
              <strong>{formatCurrency(order.total || 0)}</strong>
            </div>
          </div>
        </div>

        <div className="admin-order-detail-items">
          <div className="admin-order-detail-section-title">
            <p className="admin-kicker"><PackageSearch size={15} /> {t('admin.orderItems')}</p>
            <span>{t('admin.productCount', { count: order.items?.length || 0 })}</span>
          </div>
          {(order.items || []).map((item, index) => (
            <button
              key={`${order.id}-${item.productId || item.name}-${index}`}
              type="button"
              className="admin-order-detail-item"
              onClick={() => onOpenProduct(item)}
            >
              <span className="admin-order-detail-icon"><PackageSearch size={17} /></span>
              <span>
                <strong>{item.name}</strong>
                <small>SKU #{item.productId || t('admin.noInfo')}</small>
              </span>
              <span>
                <small>{item.quantity} x {formatCurrency(item.price || 0)}</small>
                <strong>{formatCurrency(getItemTotal(item))}</strong>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AdminOrderDetailDialog
