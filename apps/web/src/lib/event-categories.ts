export function extractEventCategories(events: { category: string | null }[]) {
  const set = new Set<string>()
  for (const event of events) {
    const value = event.category?.trim()
    if (value) set.add(value)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
