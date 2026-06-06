import { Search } from 'lucide-react'

function AdminSearchInput({ onChange, placeholder, value }) {
  return (
    <label className="admin-filter-search">
      <span>{placeholder}</span>
      <div>
        <Search size={16} />
        <input
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
