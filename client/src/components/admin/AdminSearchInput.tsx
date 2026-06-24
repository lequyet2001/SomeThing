import { Search } from 'lucide-react'

import type { AdminSearchInputProps } from '../../types/shop'

function AdminSearchInput({ onChange, placeholder, value }: AdminSearchInputProps) {
  return (
    <label className="grid gap-2 text-sm font-black text-muted">
      <span>{placeholder}</span>
      <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 shadow-soft transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        <Search className="shrink-0 text-primaryDark" size={16} />
        <input
          className="border-0 bg-transparent p-0 shadow-none focus:ring-0"
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  )
}

export default AdminSearchInput
