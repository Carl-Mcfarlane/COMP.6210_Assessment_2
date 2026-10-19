import { supabase } from '../lib/supabaseClient.js'

// falls back to the local Express server if the env var isn't set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

// reads the current session's access token (if any) straight from Supabase
// rather than threading it through props; signed-out visitors send no header
// and can still read, but the API rejects writes without one
async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    userId: data.session?.user?.id ?? null,
  }
}

// one place for auth headers, JSON bodies and error parsing; resolves with the
// Response and the id of the user the request was made as
export async function request(path, { method = 'GET', json, body, fallback = 'Request failed' } = {}) {
  const { headers, userId } = await authHeaders()
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
  return { response, userId }
}

// backend returns subjects shaped for the DB (item, object_classes, containment_procedures);
// the pages expect the older "entry" shape (id, objectClass, paragraph arrays), so map here
export function mapSubjectToEntry(subject) {
  return {
    id: subject.item,
    dbId: subject.id,
    canEdit: subject.can_edit,
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
