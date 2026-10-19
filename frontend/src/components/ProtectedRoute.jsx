import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

// gates a route behind a signed-in session, and optionally behind the
// admin role too - used to wrap /scp/new and /scp/:id/edit (per-entry
// ownership is checked by the page and enforced again by the API)
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (adminOnly && role !== 'admin') return <Navigate to="/catalogue" replace />

  return children
}

export default ProtectedRoute
