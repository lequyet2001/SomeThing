import { BarChart3, Boxes, ShoppingBag, Users } from 'lucide-react'

import { formatCurrency } from '../../utils/currency'
import BarChartList from './BarChartList'

function AdminOverviewSection({
  handleStatsFilterSubmit,
  leastProducts,
  monthlyRevenue,
  overviewView,
  resetStatsFilters,
  setOverviewView,
  setStatsFilters,
  statsFilters,
  summary,
  summaryData,
  t,
  topCustomers,
  topProducts,
}) {
  return (
    <>
      <section className="admin-panel admin-report-filter">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-kicker"><BarChart3 size={15} /> {t('admin.reportFilter')}</p>
            <h2>{t('admin.periodStats')}</h2>
          </div>
          <span>{summaryData?.period?.hasFilter ? summaryData.period.label : t('admin.periodAll')}</span>
        </div>
        <form className="admin-report-form" onSubmit={handleStatsFilterSubmit}>
          <label>
            {t('admin.periodType')}
            <select
              value={statsFilters.mode}
              onChange={(event) => setStatsFilters((current) => ({ ...current, mode: event.target.value }))}
            >
              <option value="month">{t('admin.periodMonth')}</option>
              <option value="range">{t('admin.periodRange')}</option>
            </select>
          </label>
          {statsFilters.mode === 'month' ? (
            <label>
              {t('admin.month')}
              <input
                type="month"
                value={statsFilters.month}
                onChange={(event) => setStatsFilters((current) => ({ ...current, month: event.target.value }))}
              />
            </label>
          ) : (
            <>
              <label>
                {t('admin.startDate')}
                <input
                  type="date"
                  value={statsFilters.startDate}
                  onChange={(event) => setStatsFilters((current) => ({ ...current, startDate: event.target.value }))}
                />
              </label>
              <label>
                {t('admin.endDate')}
                <input
                  type="date"
                  value={statsFilters.endDate}
                  onChange={(event) => setStatsFilters((current) => ({ ...current, endDate: event.target.value }))}
                />
              </label>
            </>
          )}
          <div className="admin-report-actions">
            <button className="primary-action" type="submit">{t('admin.applyStats')}</button>
            <button type="button" onClick={resetStatsFilters}>{t('admin.clearStats')}</button>
          </div>
        </form>
      </section>

      <div className="admin-overview-grid">
        <div className="admin-view-toggle" role="group" aria-label={t('admin.chartView')}>
          <button
            type="button"
            className={overviewView === 'list' ? 'is-active' : ''}
            onClick={() => setOverviewView('list')}
          >
            {t('admin.listView')}
          </button>
          <button
            type="button"
            className={overviewView === 'chart' ? 'is-active' : ''}
            onClick={() => setOverviewView('chart')}
          >
            {t('admin.chartView')}
          </button>
        </div>
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><BarChart3 size={15} /> {t('admin.stats')}</p>
              <h2>{t('admin.stats')}</h2>
            </div>
          </div>
          <div className="admin-table-wrap admin-inventory-table-wrap">
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
                  <td data-label={t('admin.metric')}>{t('admin.averageOrder')}</td>
                  <td data-label={t('admin.value')}>{formatCurrency(summary.averageOrder || 0)}</td>
                  <td data-label={t('admin.note')}>{t('admin.noCancelled')}</td>
                </tr>
                <tr>
                  <td data-label={t('admin.metric')}>Admin</td>
                  <td data-label={t('admin.value')}>{summary.adminCount || 0}</td>
                  <td data-label={t('admin.note')}>{t('admin.adminCountNote')}</td>
                </tr>
                <tr>
                  <td data-label={t('admin.metric')}>{t('admin.newContact')}</td>
                  <td data-label={t('admin.value')}>{summary.newContactCount || 0}</td>
                  <td data-label={t('admin.note')}>{t('admin.newContactNote')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="admin-overview-insights">
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
              ) : overviewView === 'chart' ? (
                <BarChartList
                  items={monthlyRevenue}
                  valueKey="revenue"
                  labelKey="month"
                  valueFormatter={(value) => formatCurrency(value)}
                  emptyText={t('admin.noRevenue')}
                />
              ) : (
                monthlyRevenue.slice(0, 5).map((item, index) => (
                  <article key={item.month} className="admin-rank-item">
                    <b>{index + 1}</b>
                    <div>
                      <span>{item.month}</span>
                      <strong>{formatCurrency(item.revenue)}</strong>
                      <p>{t('admin.orderCount', { count: item.count })}</p>
                    </div>
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
              ) : overviewView === 'chart' ? (
                <BarChartList
                  items={topProducts}
                  valueKey="quantity"
                  labelKey="name"
                  valueFormatter={(value, item) => `${t('admin.soldCount', { count: value })} | ${formatCurrency(item.revenue)}`}
                  emptyText={t('admin.noTopProducts')}
                />
              ) : (
                topProducts.slice(0, 5).map((product, index) => (
                  <article key={product.productId} className="admin-rank-item">
                    <b>{index + 1}</b>
                    <div>
                      <span>{t('admin.soldCount', { count: product.quantity })}</span>
                      <strong>{product.name}</strong>
                      <p>{formatCurrency(product.revenue)}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker"><Boxes size={15} /> {t('admin.lowSelling')}</p>
                <h2>{t('admin.leastProducts')}</h2>
              </div>
            </div>
            <div className="admin-mini-list">
              {leastProducts.length === 0 ? (
                <div className="admin-empty">{t('admin.noLowProducts')}</div>
              ) : overviewView === 'chart' ? (
                <BarChartList
                  items={leastProducts}
                  valueKey="quantity"
                  labelKey="name"
                  valueFormatter={(value, item) => `${t('admin.soldCount', { count: value })} | ${formatCurrency(item.revenue)}`}
                  emptyText={t('admin.noLowProducts')}
                />
              ) : (
                leastProducts.slice(0, 5).map((product, index) => (
                  <article key={product.productId} className="admin-rank-item">
                    <b>{index + 1}</b>
                    <div>
                      <span>{t('admin.soldCount', { count: product.quantity })}</span>
                      <strong>{product.name}</strong>
                      <p>{formatCurrency(product.revenue)}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker"><Users size={15} /> {t('admin.topCustomers')}</p>
                <h2>{t('admin.topCustomers')}</h2>
              </div>
            </div>
            <div className="admin-mini-list">
              {topCustomers.length === 0 ? (
                <div className="admin-empty">{t('admin.noTopCustomers')}</div>
              ) : overviewView === 'chart' ? (
                <BarChartList
                  items={topCustomers}
                  valueKey="totalSpent"
                  labelKey="name"
                  valueFormatter={(value, item) => `${formatCurrency(value)} | ${t('admin.orderCount', { count: item.orderCount })}`}
                  emptyText={t('admin.noTopCustomers')}
                />
              ) : (
                topCustomers.slice(0, 5).map((customer, index) => (
                  <article key={customer.email} className="admin-rank-item">
                    <b>{index + 1}</b>
                    <div>
                      <span>{t('admin.customerSpent')}</span>
                      <strong>{customer.name}</strong>
                      <p>{customer.email}</p>
                      <p>{formatCurrency(customer.totalSpent)} | {t('admin.orderCount', { count: customer.orderCount })} | {t('admin.itemCount', { count: customer.itemCount })}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

export default AdminOverviewSection
