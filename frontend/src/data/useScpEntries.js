import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

// falls back to the local Express server if the env var isn't set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

// every /api/subjects route requires a signed-in session - read the current
// access token straight from Supabase rather than threading it through props
async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// backend returns subjects shaped for the DB (item, object_classes, containment_procedures);
// the pages expect the older "entry" shape (id, objectClass, paragraph arrays), so map here
function mapSubjectToEntry(subject) {
  return {
    id: subject.item,
    dbId: subject.id,
    objectClass: subject.object_classes?.name,
    description: subject.description ? [subject.description] : [],
    image: subject.image,
    containmentProcedures: (subject.containment_procedures ?? []).map(
      (procedure) => procedure.procedure_text,
    ),
    history: (subject.incident_logs ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((log) => ({ date: log.log_date, text: log.entry_text })),
    additionalSections: (subject.appendices ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((appendix) => ({ heading: appendix.heading, content: [appendix.body] })),
  }
}

export function useScpEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const headers = await authHeaders()
        const response = await fetch(`${API_BASE_URL}/api/subjects`, { headers })
        if (!response.ok) throw new Error(`Failed to load subjects (${response.status})`)
        const subjects = await response.json()
        if (cancelled) return
        setEntries(subjects.map(mapSubjectToEntry))
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  // one place for auth headers, JSON bodies and error parsing
  async function request(path, { method, json, body, fallback }) {
    const headers = await authHeaders()
    if (json !== undefined) headers['Content-Type'] = 'application/json'
    const response = await fetch(`${API_BASE_URL}/api/subjects${path}`, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : body,
    })
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.error ?? `${fallback} (${response.status})`)
    }
    return response
  }

  async function deleteEntry(dbId) {
    await request(`/${dbId}`, { method: 'DELETE', fallback: 'Failed to delete subject' })
    setEntries((current) => current.filter((entry) => entry.dbId !== dbId))
  }

  async function createEntry(payload) {
    const response = await request('', { method: 'POST', json: payload, fallback: 'Failed to create subject' })
    const entry = mapSubjectToEntry(await response.json())
    setEntries((current) => [...current, entry])
    return entry
  }

  async function updateEntry(dbId, payload) {
    const response = await request(`/${dbId}`, { method: 'PUT', json: payload, fallback: 'Failed to update subject' })
    const entry = mapSubjectToEntry(await response.json())
    setEntries((current) => current.map((item) => (item.dbId === dbId ? entry : item)))
    return entry
  }

  async function uploadImage(dbId, file) {
    const formData = new FormData()
    formData.append('image', file)
    // no Content-Type header - the browser sets multipart/form-data with
    // the right boundary itself once it sees a FormData body
    const response = await request(`/${dbId}/image`, { method: 'POST', body: formData, fallback: 'Failed to upload image' })
    const entry = mapSubjectToEntry(await response.json())
    setEntries((current) => current.map((item) => (item.dbId === dbId ? entry : item)))
    return entry
  }

  return { entries, loading, error, deleteEntry, createEntry, updateEntry, uploadImage }
}
