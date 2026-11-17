import { useState } from 'react'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import { roleHomePath } from '../context/authRoles.js'
import useAuth from '../context/useAuth.js'

const roleLabels = {
  STAFF: 'Staff',
  ICT_ADMIN: 'ICT Admin',
  ICT_TECHNICIAN_TEAM_LEAD: 'ICT Technician Team Lead',
  ICT_TECHNICIAN: 'ICT Technician',
}

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    setError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (logoutError) {
      setError(logoutError.message)
      setLoggingOut(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-main">
        <div className="auth-card">
          <div className="dashboard-auth-heading"><Brand /></div>
          <div className="auth-intro" style={{ marginTop: 32 }}>
            <span className="eyebrow"><span className="eyebrow-dot" /> {roleLabels[user.role]}</span>
            <h1>Welcome, {user.fullName}</h1>
            <p>You are signed in to the Campus Maintenance Request System.</p>
          </div>
          <div className="form-message"><ShieldCheck size={16} />Authenticated as {roleLabels[user.role]} · {user.email}</div>
          {error && <div className="form-message error" role="alert">{error}</div>}
          <button className="button button-outline auth-submit" type="button" onClick={handleLogout} disabled={loggingOut}>
            <LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
          <p className="auth-switch">Role landing page: {roleHomePath(user.role)}</p>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
