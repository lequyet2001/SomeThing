import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface BarChartListProps<TItem extends Record<string, unknown>> {
  emptyText: string
  items: TItem[]
  labelKey: string
  onOpenItem?: (item: TItem) => void
  valueFormatter: (value: number, item: TItem) => string
  valueKey: string
}

interface ChartDatum<TItem extends Record<string, unknown>> {
  fill: string
  formattedValue: string
  item: TItem
  key: string
  label: string
  value: number
}

function BarChartList<TItem extends Record<string, unknown>>({
  emptyText,
  items,
  labelKey,
  onOpenItem,
  valueFormatter,
  valueKey,
}: BarChartListProps<TItem>) {
  if (items.length === 0) {
    return <div className="rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted">{emptyText}</div>
  }

  const colors = ['#2563eb', '#14b8a6', '#f59e0b', '#e85d75', '#6366f1']
  const chartData: Array<ChartDatum<TItem>> = items.slice(0, 5).map((item, index) => {
    const value = Number(item[valueKey]) || 0
    return {
      fill: colors[index % colors.length],
      formattedValue: valueFormatter(value, item),
      item,
      key: String(item.id || item.productId || item.email || `${item[labelKey]}-${index}`),
      label: String(item[labelKey] || ''),
      value,
    }
  })

  function handleBarClick(entry: unknown) {
    const payload = (entry as { payload?: ChartDatum<TItem> })?.payload
    if (payload) onOpenItem?.(payload.item)
  }

  return (
    <div className="grid gap-4 rounded-md border border-line bg-white p-3 shadow-soft">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ bottom: 8, left: -20, right: 8, top: 8 }}>
            <CartesianGrid stroke="#d9e5f5" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              interval={0}
              tick={{ fill: '#596476', fontSize: 11, fontWeight: 700 }}
              tickFormatter={(value: string) => (value.length > 14 ? `${value.slice(0, 14)}…` : value)}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#596476', fontSize: 11, fontWeight: 700 }}
              tickFormatter={(value: number) => Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
              formatter={(_value, _name, props) => {
                const payload = props.payload as ChartDatum<TItem> | undefined
                return [payload?.formattedValue || '', payload?.label || '']
              }}
              labelStyle={{ color: '#172033', fontWeight: 900 }}
              contentStyle={{
                border: '1px solid #c8d7ee',
                borderRadius: 8,
                boxShadow: '0 18px 48px rgba(33,60,114,0.13)',
                fontWeight: 700,
              }}
            />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              onClick={onOpenItem ? handleBarClick : undefined}
              cursor={onOpenItem ? 'pointer' : 'default'}
            >
              {chartData.map((item) => (
                <Cell key={item.key} fill={item.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2">
        {chartData.map((item) => (
          <button
            key={item.key}
            type="button"
            className="flex items-center justify-between gap-3 rounded-md border border-line bg-surfaceMuted px-3 py-2 text-left shadow-none hover:border-primary hover:bg-primary/5"
            disabled={!onOpenItem}
            onClick={() => onOpenItem?.(item.item)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <i className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="truncate text-sm font-black text-ink">{item.label}</span>
            </span>
            <strong className="shrink-0 text-sm font-black text-primaryDark">{item.formattedValue}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}

export default BarChartList
