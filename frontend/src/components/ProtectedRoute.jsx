import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

// gates a route behind a signed-in session, and optionally behind the
// admin role too - used to wrap /catalogue, /scp/:id, /scp/new, /scp/:id/edit
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (adminOnly && role !== 'admin') return <Navigate to="/catalogue" replace />

  return children
}

export default ProtectedRoute
