import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  type RowData,
  useReactTable,
} from '@tanstack/react-table'
import clsx from 'clsx'
import type { ReactNode } from 'react'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    cellClassName?: string
    headerClassName?: string
    mobileLabel?: ReactNode
  }
}

interface DataTableProps<TData extends RowData> {
  columns: Array<ColumnDef<TData, unknown>>
  data: TData[]
  emptyMessage?: ReactNode
  getRowDomId?: (row: TData) => string
  getRowId?: (row: TData, index: number) => string
  isLoading?: boolean
  loadingMessage?: ReactNode
  loadingRows?: number
  onRowClick?: (row: TData) => void
  rowClassName?: (row: TData) => string
}

function getColumnLabel<TData extends RowData>(column: ColumnDef<TData, unknown>): ReactNode {
  if (column.meta?.mobileLabel) return column.meta.mobileLabel
  if (typeof column.header === 'string') return column.header
  return ''
}

function DataTable<TData extends RowData>({
  columns,
  data,
  emptyMessage,
  getRowDomId,
  getRowId,
  isLoading = false,
  loadingMessage,
  loadingRows = 6,
  onRowClick,
  rowClassName,
}: DataTableProps<TData>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  })

  return (
    <div className="w-full overflow-hidden rounded-md border border-line bg-white shadow-soft" aria-busy={isLoading}>
      <div className="w-full overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="hidden bg-surfaceMuted md:table-header-group">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={clsx(
                      'px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-muted',
                      header.column.columnDef.meta?.headerClassName,
                    )}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="block divide-y divide-line md:table-row-group">
            {isLoading && Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <tr key={`loading-${rowIndex}`} className="block bg-white md:table-row">
                {columns.map((column, columnIndex) => {
                  const label = getColumnLabel(column)
                  return (
                    <td
                      key={`loading-${rowIndex}-${columnIndex}`}
                      className={clsx(
                        'grid grid-cols-[118px_1fr] gap-3 px-4 py-3 text-sm font-semibold text-ink md:table-cell md:px-4 md:py-3 md:align-top',
                        column.meta?.cellClassName,
                      )}
                    >
                      <span className="text-xs font-black uppercase text-muted md:hidden">{label}</span>
                      <div className="min-w-0">
                        <span className="block h-5 w-full max-w-48 animate-pulse rounded-full bg-slate-200" />
                        {rowIndex === 0 && columnIndex === 0 && loadingMessage ? (
                          <span className="sr-only">{loadingMessage}</span>
                        ) : null}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
            {!isLoading && table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                id={getRowDomId?.(row.original)}
                className={clsx(
                  'block bg-white transition md:table-row',
                  onRowClick && 'cursor-pointer hover:bg-primary/5',
                  rowClassName?.(row.original),
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const label = getColumnLabel(cell.column.columnDef)
                  return (
                    <td
                      key={cell.id}
                      className={clsx(
                        'grid grid-cols-[118px_1fr] gap-3 px-4 py-3 text-sm font-semibold text-ink md:table-cell md:px-4 md:py-3 md:align-top',
                        cell.column.columnDef.meta?.cellClassName,
                      )}
                    >
                      <span className="text-xs font-black uppercase text-muted md:hidden">{label}</span>
                      <div className="min-w-0">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                    </td>
                  )
                })}
              </tr>
            ))}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <tr className="block md:table-row">
                <td className="block px-4 py-8 text-center text-sm font-extrabold text-muted md:table-cell" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
export type { ColumnDef }
