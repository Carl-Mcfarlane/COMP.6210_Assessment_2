// used by both the catalogue search bar and the header's search dropdown,
// so the matching logic only lives in one place
export function filterEntries(entries, query) {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (entry) =>
      entry.id.toLowerCase().includes(q) ||
      entry.objectClass?.toLowerCase().includes(q),
  )
}
