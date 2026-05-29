import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Info,
  PackagePlus,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useLanguage } from '../i18n/LanguageContext'
import { shopApi } from '../services/shopApi'
import { formatCategoryLabel } from '../utils/categoryLabel'
import { formatCurrency } from '../utils/currency'

const orderStatusOptions = [
  { value: 'confirmed', labelKey: 'admin.orderStatus.confirmed' },
  { value: 'paid', labelKey: 'admin.orderStatus.paid' },
  { value: 'shipping', labelKey: 'admin.orderStatus.shipping' },
  { value: 'completed', labelKey: 'admin.orderStatus.completed' },
  { value: 'cancelled', labelKey: 'admin.orderStatus.cancelled' },
]

const contactStatusOptions = [
  { value: 'new', labelKey: 'admin.contactStatus.new' },
  { value: 'processing', labelKey: 'admin.contactStatus.processing' },
  { value: 'done', labelKey: 'admin.contactStatus.done' },
]

const adminTabs = [
  { id: 'overview', labelKey: 'admin.overview', icon: BarChart3 },
  { id: 'orders', labelKey: 'admin.orders', icon: ClipboardList },
  { id: 'products', labelKey: 'admin.products', icon: Boxes },
  { id: 'users', labelKey: 'admin.users', icon: Users },
  { id: 'contacts', labelKey: 'admin.contacts', icon: Inbox },
]

const emptyProductForm = {
  name: '',
  category: '',
  newCategory: '',
  price: '',
  stock: '',
  image: '',
  description: '',
}

function formatDate(value, language, emptyText) {
  if (!value) return emptyText
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function notifyCatalogChanged() {
  window.dispatchEvent(new Event('marseille04:catalog-changed'))
}

function AdminToast({ toast, onClose, closeLabel }) {
  if (!toast.message) return null

  const Icon = toast.type === 'error' ? AlertTriangle : toast.type === 'info' ? Info : CheckCircle2

  return (
    <div className={`admin-toast admin-toast-${toast.type}`} role="status" aria-live="polite">
      <Icon size={22} />
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
      <button type="button" aria-label={closeLabel} onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  )
}

function StoreAdminPage({ section = 'overview' }) {
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [summaryData, setSummaryData] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [contacts, setContacts] = useState([])
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [productImageFile, setProductImageFile] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [editingProductId, setEditingProductId] = useState(null)
  const [deleteProductTarget, setDeleteProductTarget] = useState(null)
  const [toast, setToast] = useState({ message: '', title: '', type: 'success' })
  const [isLoading, setIsLoading] = useState(true)

  const summary = summaryData?.summary || {}
  const lowStockProducts = summaryData?.lowStockProducts || []
  const monthlyRevenue = summaryData?.monthlyRevenue || []
  const topProducts = summaryData?.topProducts || []
  const productCategories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products],
  )

  const awaitingOrders = useMemo(
    () => orders.filter((order) => ['confirmed', 'paid', 'shipping'].includes(order.status)).length,
    [orders],
  )

  function showAdminToast(message, type = 'success', title = type === 'error' ? t('admin.toastError') : t('admin.toastSuccess')) {
    setToast({ message, title, type })
  }

  async function loadAdminData() {
    setIsLoading(true)
    try {
      const summaryResponse = await shopApi.getAdminSummary()
      setSummaryData(summaryResponse)

      if (section === 'orders') {
        const ordersResponse = await shopApi.listAdminOrders()
        setOrders(ordersResponse.orders)
      }

      if (section === 'products') {
        const productsResponse = await shopApi.listAdminProducts()
        setProducts(productsResponse.products)
      }

      if (section === 'users') {
        const usersResponse = await shopApi.listAdminUsers()
        setUsers(usersResponse.users)
      }

      if (section === 'contacts') {
        const contactsResponse = await shopApi.listAdminContacts()
        setContacts(contactsResponse.contacts)
      }
    } catch (error) {
      showAdminToast(error.message, 'error')
      const message = error.message.toLowerCase()
      if (message.includes('admin') || message.includes('dang nhap') || message.includes('đăng nhập')) {
        navigate('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [section])

  useEffect(() => {
    return () => {
      if (productImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(productImagePreview)
      }
    }
  }, [productImagePreview])

  useEffect(() => {
    if (!toast.message) return undefined

    const timer = window.setTimeout(() => {
      setToast({ message: '', title: '', type: 'success' })
    }, 3600)

    return () => window.clearTimeout(timer)
  }, [toast])

  function resetProductForm() {
    setEditingProductId(null)
    setProductForm(emptyProductForm)
    setProductImageFile(null)
    setProductImagePreview('')
  }

  function editProduct(product) {
    setEditingProductId(product.id)
    setProductForm({
      name: product.name,
      category: product.category,
      newCategory: '',
      price: product.price,
      stock: product.stock,
      image: product.image,
      description: product.description,
    })
    setProductImageFile(null)
    setProductImagePreview(product.image)
  }

  function handleProductImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setProductImageFile(file)
    setProductImagePreview(URL.createObjectURL(file))
  }

  async function handleProductSubmit(event) {
    event.preventDefault()
    try {
      let image = productForm.image
      if (productImageFile) {
        const upload = await shopApi.uploadProductImage(productImageFile)
        image = upload.url
      }

      const payload = {
        ...productForm,
        category: productForm.category === '__new__' ? productForm.newCategory.trim() : productForm.category,
        image,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      }
      delete payload.newCategory

      const data = editingProductId
        ? await shopApi.updateAdminProduct(editingProductId, payload)
        : await shopApi.createAdminProduct(payload)

      setProducts((current) => {
        if (!editingProductId) return [...current, data.product].sort((first, second) => first.id - second.id)
        return current.map((product) => (product.id === data.product.id ? data.product : product))
      })
      showAdminToast(data.message)
      resetProductForm()
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  async function confirmDeleteProduct() {
    if (!deleteProductTarget) return
    try {
      const data = await shopApi.deleteAdminProduct(deleteProductTarget.id)
      setProducts((current) => current.filter((product) => product.id !== deleteProductTarget.id))
      showAdminToast(data.message)
      setDeleteProductTarget(null)
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  async function handleOrderStatus(orderCode, status) {
    try {
      const data = await shopApi.updateOrderStatus(orderCode, status)
      setOrders((current) => current.map((order) => (order.id === orderCode ? data.order : order)))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  async function handleContactStatus(contactId, status) {
    try {
      const data = await shopApi.updateContactStatus(contactId, status)
      setContacts((current) => current.map((contact) => (contact.id === contactId ? data.contact : contact)))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  async function handleUserRole(userId, role) {
    try {
      const data = await shopApi.updateUserRole(userId, role)
      setUsers((current) => current.map((user) => (user.id === userId ? data.user : user)))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="admin-kicker"><ShieldCheck size={15} /> {t('admin.kicker')}</p>
          <h1>{t('admin.heroTitle')}</h1>
          <p>{t('admin.heroText')}</p>
        </div>
        <button className="admin-refresh" onClick={loadAdminData} disabled={isLoading}>
          <RefreshCw size={17} />
          {t('admin.refresh')}
        </button>
      </div>

      <AdminToast
        toast={toast}
        closeLabel={t('admin.closeToast')}
        onClose={() => setToast({ message: '', title: '', type: 'success' })}
      />

      <div className="admin-metrics">
        <article>
          <ShoppingBag size={22} />
          <span>{t('admin.revenue')}</span>
          <strong>{formatCurrency(summary.revenue || 0)}</strong>
        </article>
        <article>
          <ClipboardList size={22} />
          <span>{t('admin.orders')}</span>
          <strong>{summary.orderCount || 0}</strong>
        </article>
        <article>
          <Truck size={22} />
          <span>{t('admin.pending')}</span>
          <strong>{awaitingOrders || summary.pendingOrderCount || 0}</strong>
        </article>
        <article>
          <Users size={22} />
          <span>{t('admin.users')}</span>
          <strong>{summary.userCount || 0}</strong>
        </article>
        <article>
          <Boxes size={22} />
          <span>{t('admin.products')}</span>
          <strong>{summary.productCount || 0}</strong>
        </article>
        <article>
          <AlertTriangle size={22} />
          <span>{t('admin.lowStock')}</span>
          <strong>{summary.lowStockCount || 0}</strong>
        </article>
      </div>

      <nav className="admin-tabs" aria-label={t('admin.kicker')}>
        {adminTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.id}
              to={`/admin/${tab.id}`}
              className={({ isActive }) => (isActive || section === tab.id ? 'is-active' : '')}
            >
              <Icon size={17} />
              {t(tab.labelKey)}
            </NavLink>
          )
        })}
      </nav>

      {section === 'overview' && (
        <div className="admin-grid">
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker"><BarChart3 size={15} /> {t('admin.stats')}</p>
                <h2>{t('admin.stats')}</h2>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.metric')}</th>
                    <th>{t('admin.value')}</th>
                    <th>{t('admin.note')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t('admin.averageOrder')}</td>
                    <td>{formatCurrency(summary.averageOrder || 0)}</td>
                    <td>{t('admin.noCancelled')}</td>
                  </tr>
                  <tr>
                    <td>Admin</td>
                    <td>{summary.adminCount || 0}</td>
                    <td>{t('admin.adminCountNote')}</td>
                  </tr>
                  <tr>
                    <td>{t('admin.newContact')}</td>
                    <td>{summary.newContactCount || 0}</td>
                    <td>{t('admin.newContactNote')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <aside className="admin-side">
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-kicker"><ShoppingBag size={15} /> {t('admin.revenue')}</p>
                  <h2>{t('admin.revenueByMonth')}</h2>
                </div>
              </div>
              <div className="admin-mini-list">
                {monthlyRevenue.length === 0 ? (
                  <div className="admin-empty">{t('admin.noRevenue')}</div>
                ) : (
                  monthlyRevenue.map((item) => (
                    <article key={item.month}>
                      <span>{item.month}</span>
                      <strong>{formatCurrency(item.revenue)}</strong>
                      <p>{t('admin.orderCount', { count: item.count })}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-kicker"><Boxes size={15} /> {t('admin.topSelling')}</p>
                  <h2>{t('admin.topProducts')}</h2>
                </div>
              </div>
              <div className="admin-mini-list">
                {topProducts.length === 0 ? (
                  <div className="admin-empty">{t('admin.noTopProducts')}</div>
                ) : (
                  topProducts.map((product) => (
                    <article key={product.productId}>
                      <span>{t('admin.soldCount', { count: product.quantity })}</span>
                      <strong>{product.name}</strong>
                      <p>{formatCurrency(product.revenue)}</p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      )}

      {section === 'orders' && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><ClipboardList size={15} /> {t('admin.orders')}</p>
              <h2>{t('admin.manageOrders')}</h2>
            </div>
            <span>{t('admin.orderCount', { count: orders.length })}</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.orderCode')}</th>
                  <th>{t('admin.customer')}</th>
                  <th>{t('admin.createdAt')}</th>
                  <th>{t('admin.items')}</th>
                  <th>{t('admin.total')}</th>
                  <th>{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.id}</strong></td>
                    <td>
                      <strong>{order.customer.name}</strong>
                      <small>{order.customer.email}</small>
                      <small>{order.customer.address}</small>
                    </td>
                    <td>{formatDate(order.createdAt, language, t('admin.noInfo'))}</td>
                    <td>{t('admin.productCount', { count: order.items.length })}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <select value={order.status} onChange={(event) => handleOrderStatus(order.id, event.target.value)}>
                        {orderStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="6">{t('admin.noOrders')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'products' && (
        <div className="admin-grid">
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker"><Boxes size={15} /> {t('admin.products')}</p>
                <h2>{t('admin.catalogTable')}</h2>
              </div>
              <span>{t('admin.productCount', { count: products.length })}</span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.product')}</th>
                    <th>{t('admin.category')}</th>
                    <th>{t('admin.price')}</th>
                    <th>{t('admin.stockShort')}</th>
                    <th>{t('admin.rating')}</th>
                    <th>{t('admin.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          <img src={product.image} alt={product.name} />
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td>{formatCategoryLabel(product.category)}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.stock}</td>
                      <td>{product.rating}</td>
                      <td>
                        <div className="admin-actions">
                          <button type="button" onClick={() => editProduct(product)}><Save size={15} /> {t('admin.edit')}</button>
                          <button type="button" className="danger" onClick={() => setDeleteProductTarget(product)}>
                            <Trash2 size={15} />
                            {t('admin.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker"><PackagePlus size={15} /> {t('admin.formCatalog')}</p>
                <h2>{editingProductId ? t('admin.editProduct') : t('admin.addProduct')}</h2>
              </div>
              {editingProductId && (
                <button className="admin-icon-button" type="button" onClick={resetProductForm} aria-label={t('admin.cancelEdit')}>
                  <X size={17} />
                </button>
              )}
            </div>
            <form className="admin-form" onSubmit={handleProductSubmit}>
              <label>
                {t('admin.productName')}
                <input
                  value={productForm.name}
                  onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('admin.category')}
                <select
                  value={productForm.category}
                  onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                  required
                >
                  <option value="">{t('admin.chooseCategory')}</option>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>{formatCategoryLabel(category)}</option>
                  ))}
                  <option value="__new__">+ {t('admin.newCategory')}</option>
                </select>
              </label>
              {productForm.category === '__new__' && (
                <label>
                  {t('admin.newCategory')}
                  <input
                    value={productForm.newCategory}
                    onChange={(event) => setProductForm((current) => ({ ...current, newCategory: event.target.value }))}
                    required
                  />
                </label>
              )}
              <label>
                {t('admin.price')}
                <input
                  type="number"
                  min="0"
                  value={productForm.price}
                  onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('admin.stock')}
                <input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('admin.productImage')}
                <input type="file" accept="image/*" onChange={handleProductImageChange} required={!editingProductId && !productForm.image} />
              </label>
              {(productImagePreview || productForm.image) && (
                <div className="admin-image-preview">
                  <img src={productImagePreview || productForm.image} alt={t('admin.productImage')} />
                  <span>{productImageFile ? productImageFile.name : t('admin.savedImage')}</span>
                </div>
              )}
              <label>
                {t('admin.description')}
                <textarea
                  value={productForm.description}
                  onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                  required
                />
              </label>
              <button className="primary-action"><Save size={17} /> {editingProductId ? t('admin.saveProduct') : t('admin.addProduct')}</button>
            </form>
          </aside>
        </div>
      )}

      {section === 'users' && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><UserCog size={15} /> {t('admin.users')}</p>
              <h2>{t('admin.users')}</h2>
            </div>
            <span>{t('admin.userCount', { count: users.length })}</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.customer')}</th>
                  <th>Email</th>
                  <th>{t('admin.phone')}</th>
                  <th>{t('admin.createdAt')}</th>
                  <th>{t('admin.role')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td>{user.phone || t('admin.noInfo')}</td>
                    <td>{formatDate(user.createdAt, language, t('admin.noInfo'))}</td>
                    <td>
                      <select value={user.role} onChange={(event) => handleUserRole(user.id, event.target.value)}>
                        <option value="customer">{t('admin.roleCustomer')}</option>
                        <option value="admin">{t('admin.roleAdmin')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'contacts' && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><Inbox size={15} /> {t('admin.contacts')}</p>
              <h2>{t('admin.contactTable')}</h2>
            </div>
            <span>{t('admin.contactCount', { count: contacts.length })}</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.customer')}</th>
                  <th>{t('admin.topic')}</th>
                  <th>{t('admin.message')}</th>
                  <th>{t('admin.sentAt')}</th>
                  <th>{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>
                      <strong>{contact.name}</strong>
                      <small>{contact.email}</small>
                      <small>{contact.phone || t('admin.noPhone')}</small>
                    </td>
                    <td>{contact.topic}</td>
                    <td>{contact.message}</td>
                    <td>{formatDate(contact.createdAt, language, t('admin.noInfo'))}</td>
                    <td>
                      <select value={contact.status} onChange={(event) => handleContactStatus(contact.id, event.target.value)}>
                        {contactStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'overview' && lowStockProducts.length > 0 && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><AlertTriangle size={15} /> {t('admin.stock')}</p>
              <h2>{t('admin.lowStock')}</h2>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.product')}</th>
                  <th>{t('admin.category')}</th>
                  <th>{t('admin.price')}</th>
                  <th>{t('admin.stock')}</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        <img src={product.image} alt={product.name} />
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>{formatCategoryLabel(product.category)}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {deleteProductTarget && (
        <div className="admin-dialog-backdrop" role="presentation">
          <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
            <div className="admin-dialog-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="admin-dialog-copy">
              <h2 id="delete-product-title">{t('admin.deleteProductQuestion')}</h2>
              <p>
                {t('admin.deleteProductText', { name: deleteProductTarget.name })}
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setDeleteProductTarget(null)}>{t('admin.cancelDelete')}</button>
              <button type="button" className="danger" onClick={confirmDeleteProduct}>
                <Trash2 size={16} />
                {t('admin.deleteProduct')}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default StoreAdminPage
