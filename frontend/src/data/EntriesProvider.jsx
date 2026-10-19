import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { EntriesContext } from './entriesContext.js'
import { mapSubjectToEntry, request } from './entriesApi.js'

// fetches the entry list once and shares it with every page. It reloads when
// the signed-in user changes, because each entry's canEdit flag depends on who
// is asking. Must sit inside AuthProvider.
export function EntriesProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // the user the current list was fetched as, and a counter so a slow older
  // response can't overwrite a newer one
  const loadedFor = useRef(undefined)
  const latestRequest = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current
    try {
      const { response, userId: requestedAs } = await request('', { fallback: 'Failed to load subjects' })
      const subjects = await response.json()
      if (requestId !== latestRequest.current) return
      loadedFor.current = requestedAs
      setEntries(subjects.map(mapSubjectToEntry))
      setError(null)
    } catch (err) {
      if (requestId !== latestRequest.current) return
      setError(err)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [])

  // the first run happens before the session has loaded into context, so the
  // fetch reports which user it actually ran as; if that already matches, a
  // later userId change is not a reason to fetch again
  useEffect(() => {
    if (loadedFor.current === userId) return
    load()
  }, [userId, load])

  const deleteEntry = useCallback(async (dbId) => {
    await request(`/${dbId}`, { method: 'DELETE', fallback: 'Failed to delete subject' })
    setEntries((current) => current.filter((entry) => entry.dbId !== dbId))
  }, [])

  const createEntry = useCallback(async (payload) => {
    const { response } = await request('', { method: 'POST', json: payload, fallback: 'Failed to create subject' })
    const entry = mapSubjectToEntry(await response.json())
    setEntries((current) => [...current, entry])
    return entry
  }, [])

  const updateEntry = useCallback(async (dbId, payload) => {
    const { response } = await request(`/${dbId}`, { method: 'PUT', json: payload, fallback: 'Failed to update subject' })
    const entry = mapSubjectToEntry(await response.json())
    setEntries((current) => current.map((item) => (item.dbId === dbId ? entry : item)))
    return entry
  }, [])

  const uploadImage = useCallback(async (dbId, file) => {
    const formData = new FormData()
    formData.append('image', file)
    // no Content-Type header - the browser sets multipart/form-data with
    // the right boundary itself once it sees a FormData body
    const { response } = await request(`/${dbId}/image`, { method: 'POST', body: formData, fallback: 'Failed to upload image' })
    const entry = mapSubjectToEntry(await response.json())
    setEntries((current) => current.map((item) => (item.dbId === dbId ? entry : item)))
    return entry
  }, [])

  const value = useMemo(
    () => ({ entries, loading, error, deleteEntry, createEntry, updateEntry, uploadImage }),
    [entries, loading, error, deleteEntry, createEntry, updateEntry, uploadImage],
  )

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
}
