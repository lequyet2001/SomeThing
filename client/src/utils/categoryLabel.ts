const CATEGORY_LABELS: Record<string, string> = {
  Ao: 'Áo',
  'Áo': 'Áo',
  Quan: 'Quần',
  'Quần': 'Quần',
  Tui: 'Túi',
  'Túi': 'Túi',
  Giay: 'Giày',
  'Giày': 'Giày',
  'Phu kien': 'Phụ kiện',
  'Phụ kiện': 'Phụ kiện',
}

export function formatCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] || category
}

export function findMatchingCategory(categories: string[], selectedCategory: string) {
  if (categories.includes(selectedCategory)) return selectedCategory
  const selectedLabel = formatCategoryLabel(selectedCategory)
  return categories.find((category) => formatCategoryLabel(category) === selectedLabel) || selectedCategory
}
