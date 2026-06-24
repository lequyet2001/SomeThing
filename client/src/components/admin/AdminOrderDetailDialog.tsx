import { ClipboardList, PackageSearch, UserRound } from 'lucide-react'

import AdminImagePreview from './AdminImagePreview'
import AppDialog from '../ui/AppDialog'
import { formatCurrency } from '../../utils/currency'
import { formatAdminDate } from '../../pages/admin/adminUtils'
import type { LanguageCode, Order, OrderCustomer, OrderItem, TranslateFn } from '../../types/shop'

function getItemTotal(item: OrderItem) {
  return Number(item.price || 0) * Number(item.quantity || 0)
}

function getOrderCustomerType(order: Order) {
  return order?.customerType || (order?.registeredUserId ? 'registered' : 'guest')
}

function getCustomerTypeBadgeClass(customerType: string) {
  return customerType === 'registered'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-800'
}

interface AdminOrderDetailDialogProps {
  language: LanguageCode
  onClose: () => void
  onOpenCustomer: (customer?: OrderCustomer) => void
  onOpenProduct: (item: OrderItem) => void
  order: Order | null
  t: TranslateFn
}

function AdminOrderDetailDialog({ language, onClose, onOpenCustomer, onOpenProduct, order, t }: AdminOrderDetailDialogProps) {
  if (!order) return null

  const customerType = getOrderCustomerType(order)
  const customerTypeLabel = t(`admin.customerType.${customerType}`)

  return (
    <AppDialog
      className="max-w-5xl"
      isOpen={Boolean(order)}
      onClose={onClose}
      title={order.id}
      description={(
        <span className="inline-flex flex-wrap items-center gap-2">
          <ClipboardList size={15} />
          {t('admin.orderDetail')} · {formatAdminDate(order.createdAt, language, t('admin.noInfo'))}
        </span>
      )}
    >

        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <button type="button" className="flex items-start gap-3 rounded-md border border-lineStrong/60 bg-surfaceMuted p-4 text-left shadow-soft hover:border-primary" onClick={() => onOpenCustomer(order.customer)}>
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primaryDark"><UserRound size={18} /></span>
            <span className="grid min-w-0 gap-1">
              <strong className="line-clamp-1 text-lg font-black text-ink">{order.customer?.name || t('admin.noInfo')}</strong>
              <small className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-black ${getCustomerTypeBadgeClass(customerType)}`}>
                {customerTypeLabel}
              </small>
              <small className="break-all font-bold text-muted">{order.customer?.email || t('admin.noInfo')}</small>
              <small className="font-bold text-muted">{order.customer?.phone || t('admin.noPhone')}</small>
              <small className="line-clamp-2 font-bold text-muted">{order.customer?.address || t('admin.noInfo')}</small>
            </span>
          </button>

          <div className="grid gap-3 rounded-md border border-lineStrong/60 bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-muted">{t('admin.status')}</span>
              <strong className="text-right font-black text-ink">{order.statusLabel || order.status}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-muted">{t('admin.customerType')}</span>
              <strong className="text-right font-black text-ink">{customerTypeLabel}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-muted">{t('admin.paymentMethod')}</span>
              <strong className="text-right font-black text-ink">{order.payment || t('admin.noInfo')}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-muted">{t('admin.subtotal')}</span>
              <strong className="text-right font-black text-ink">{formatCurrency(order.subtotal || 0)}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-muted">{t('admin.shippingFee')}</span>
              <strong className="text-right font-black text-ink">{formatCurrency(order.shipping || 0)}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/10 p-3">
              <span className="text-sm font-black text-muted">{t('admin.total')}</span>
              <strong className="text-xl font-black text-primaryDark">{formatCurrency(order.total || 0)}</strong>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><PackageSearch size={15} /> {t('admin.orderItems')}</p>
            <span className="rounded-full border border-line bg-surfaceMuted px-3 py-1 text-xs font-black text-primaryDark">{t('admin.productCount', { count: order.items?.length || 0 })}</span>
          </div>
          {(order.items || []).map((item, index) => (
            <button
              key={`${order.id}-${item.productId || item.name}-${index}`}
              type="button"
              className="grid items-center gap-3 rounded-md border border-line bg-white p-3 text-left shadow-soft hover:border-primary hover:bg-primary/5 sm:grid-cols-[auto_1fr_auto]"
              onClick={() => onOpenProduct(item)}
            >
              {item.image ? (
                <AdminImagePreview alt={item.name} size="sm" src={item.image} />
              ) : (
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primaryDark"><PackageSearch size={17} /></span>
              )}
              <span className="min-w-0">
                <strong className="line-clamp-2 font-black text-ink">{item.name}</strong>
                <small className="font-bold text-muted">SKU #{item.productId || t('admin.noInfo')}</small>
              </span>
              <span className="grid gap-1 text-left sm:text-right">
                <small className="font-bold text-muted">{item.quantity} x {formatCurrency(item.price || 0)}</small>
                <strong className="font-black text-primaryDark">{formatCurrency(getItemTotal(item))}</strong>
              </span>
            </button>
          ))}
        </div>
    </AppDialog>
  )
}

export default AdminOrderDetailDialog
