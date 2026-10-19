import { useContext } from 'react'
import { EntriesContext } from './entriesContext.js'

// the entries are loaded once by EntriesProvider and shared, so every page
// and the header read the same list instead of each refetching it
export function useScpEntries() {
  const context = useContext(EntriesContext)
  if (!context) throw new Error('useScpEntries must be used within an EntriesProvider')
  return context
}
