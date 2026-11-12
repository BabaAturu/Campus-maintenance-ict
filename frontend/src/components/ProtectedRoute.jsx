import { Navigate, useLocation } from 'react-router-dom'
import { roleHomePath } from '../context/authRoles.js'
import useAuth from '../context/useAuth.js'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <main className="auth-main"><p role="status">Checking your session…</p></main>
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (user.role !== role) {
    return <Navigate to={roleHomePath(user.role)} replace />
  }
  return children
}

export default ProtectedRoute
