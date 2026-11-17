import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'
import { adminApi, userApi } from '../services/authApi.js'
import './AdminDashboardPage.css'

const roleLabels = {
  STAFF: 'Staff',
  ICT_ADMIN: 'ICT Admin',
  ICT_TECHNICIAN_TEAM_LEAD: 'Technician Team Lead',
  ICT_TECHNICIAN: 'ICT Technician',
}

const requestCategories = [
  'Computer Hardware',
  'Software & Operating System',
  'Network & Internet',
  'Printer & Scanner',
  'Server & Storage',
  'ICT Classroom & Laboratory Equipment',
  'ICT Security & Other Technical Issues',
]
const requestStatuses = ['SUBMITTED', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
const requestPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || 'U'
}

function readableValue(value) {
  return String(value ?? '—').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function requestDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString()
}

function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState('')
  const [requestFilters, setRequestFilters] = useState({ status: '', category: '', priority: '' })
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [accountRole, setAccountRole] = useState('ICT_TECHNICIAN')
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError('')
    try {
      const result = await userApi.list()
      setUsers(result.users)
    } catch (error) {
      setUsersError(error.message)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError('')
    try {
      const result = await adminApi.stats()
      setStats(result.stats)
    } catch (error) {
      setStatsError(error.message)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadAdminRequests = useCallback(async (filters = {}) => {
    setRequestsLoading(true)
    setRequestsError('')
    try {
      const result = await adminApi.requests(filters)
      setMaintenanceRequests(result.requests)
    } catch (error) {
      setRequestsError(error.message)
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    userApi.list()
      .then((result) => {
        if (active) setUsers(result.users)
      })
      .catch((error) => {
        if (active) setUsersError(error.message)
      })
      .finally(() => {
        if (active) setUsersLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    adminApi.stats()
      .then((result) => {
        if (active) setStats(result.stats)
      })
      .catch((error) => {
        if (active) setStatsError(error.message)
      })
      .finally(() => {
        if (active) setStatsLoading(false)
      })
    adminApi.requests()
      .then((result) => {
        if (active) setMaintenanceRequests(result.requests)
      })
      .catch((error) => {
        if (active) setRequestsError(error.message)
      })
      .finally(() => {
        if (active) setRequestsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((item) =>
      [item.fullName, item.email, item.department, roleLabels[item.role]]
        .some((value) => String(value ?? '').toLowerCase().includes(query)),
    )
  }, [search, users])

  async function handleCreateAccount(event) {
    event.preventDefault()
    setAccountError('')
    setAccountSuccess('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const details = Object.fromEntries(formData.entries())
    setCreating(true)
    try {
      const create = accountRole === 'ICT_TECHNICIAN_TEAM_LEAD'
        ? userApi.createTeamLead
        : userApi.createTechnician
      await create(details)
      setAccountSuccess(`${roleLabels[accountRole]} account created successfully.`)
      form.reset()
      await loadUsers()
      await loadStats()
    } catch (error) {
      setAccountError(error.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(target) {
    const id = target._id ?? target.id
    setStatusUpdating(id)
    setUsersError('')
    try {
      const result = await userApi.updateStatus(id, !target.isActive)
      setUsers((current) => current.map((item) =>
        (item._id ?? item.id) === id ? result.user : item,
      ))
      setSelectedUser((current) => current && (current._id ?? current.id) === id ? result.user : current)
    } catch (error) {
      setUsersError(error.message)
    } finally {
      setStatusUpdating('')
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(error.message)
      setLoggingOut(false)
    }
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="#overview" aria-label="Campus ICT Admin home">
          <span className="admin-brand-mark"><Activity size={21} /></span>
          <span>Campus ICT<small>ADMIN CONSOLE</small></span>
        </a>
        <p className="admin-nav-label">WORKSPACE</p>
        <nav className="admin-nav" aria-label="Admin dashboard">
          <a className="admin-nav-item active" href="#overview"><LayoutDashboard size={18} />Overview</a>
          <a className="admin-nav-item" href="#users"><Users size={18} />User management</a>
          <a className="admin-nav-item" href="#accounts"><UserCheck size={18} />Create account</a>
          <a className="admin-nav-item" href="#requests"><ClipboardList size={18} />Maintenance requests</a>
          <a className="admin-nav-item" href="#profile"><UserRound size={18} />Admin profile</a>
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user">
            <span className="admin-avatar">{initials(user.fullName)}</span>
            <span className="admin-user-copy"><strong>{user.fullName}</strong><small>ICT Administrator</small></span>
          </div>
          <button type="button" className="admin-logout" onClick={handleLogout} disabled={loggingOut}>
            <LogOut size={17} />{loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
          {logoutError && <p className="admin-inline-error" role="alert">{logoutError}</p>}
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <p>Campus Maintenance <span>/</span> <strong>Admin dashboard</strong></p>
          <div className="admin-top-identity"><span className="admin-avatar">{initials(user.fullName)}</span><span>{user.fullName}</span></div>
        </header>
        <div className="admin-content">
          <section id="overview" className="admin-section">
            <div className="admin-page-heading">
              <div><span className="admin-eyebrow">ADMINISTRATION</span><h1>Admin overview</h1><p>Manage campus accounts and monitor ICT maintenance activity.</p></div>
              <span className="admin-secure-label"><ShieldCheck size={16} />Secure admin access</span>
            </div>
            {usersError && <div className="admin-alert" role="alert"><AlertCircle size={18} /><span>{usersError} <button type="button" onClick={loadUsers}>Retry users</button></span></div>}
            {statsError && <div className="admin-alert" role="alert"><AlertCircle size={18} /><span>{statsError} <button type="button" onClick={loadStats}>Retry statistics</button></span></div>}
            <div className="admin-stat-grid">
              <article className="admin-stat-card"><span className="admin-stat-icon blue"><Users size={19} /></span><span className="admin-stat-label">Total users</span><strong>{statsLoading || statsError ? '—' : stats?.totalUsers ?? '—'}</strong><small>Across all account roles</small></article>
              <article className="admin-stat-card"><span className="admin-stat-icon teal"><UserRound size={19} /></span><span className="admin-stat-label">Total staff</span><strong>{statsLoading || statsError ? '—' : stats?.totalStaff ?? '—'}</strong><small>Staff accounts</small></article>
              <article className="admin-stat-card"><span className="admin-stat-icon violet"><Wrench size={19} /></span><span className="admin-stat-label">Total technicians</span><strong>{statsLoading || statsError ? '—' : stats?.totalTechnicians ?? '—'}</strong><small>Team leads are listed separately</small></article>
              <article className="admin-stat-card"><span className="admin-stat-icon amber"><ClipboardList size={19} /></span><span className="admin-stat-label">Maintenance requests</span><strong>{statsLoading || statsError ? '—' : stats?.totalRequests ?? '—'}</strong><small>{statsLoading || statsError ? 'Request totals unavailable' : `${stats?.pendingRequests ?? 0} pending · ${stats?.completedRequests ?? 0} completed`}</small></article>
            </div>
          </section>

          <section id="users" className="admin-panel admin-section">
            <div className="admin-panel-heading">
              <div><span className="admin-eyebrow">DIRECTORY</span><h2>User management</h2><p>Search accounts, review details, and manage account access.</p></div>
              <span className="admin-record-count">{usersLoading ? 'Loading…' : `${users.length} accounts`}</span>
            </div>
            <label className="admin-search"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, department or role" aria-label="Search users" /></label>
            {usersLoading ? <p className="admin-empty" role="status">Loading accounts…</p> : usersError ? <p className="admin-empty">Accounts could not be loaded.</p> : filteredUsers.length === 0 ? <p className="admin-empty">No accounts match your search.</p> : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>USER</th><th>ROLE</th><th>DEPARTMENT</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>{filteredUsers.map((item) => {
                    const id = item._id ?? item.id
                    return <tr key={id}>
                      <td><div className="admin-table-user"><span className="admin-avatar light">{initials(item.fullName)}</span><span><strong>{item.fullName}</strong><small>{item.email}</small></span></div></td>
                      <td><span className="admin-role-badge">{roleLabels[item.role] ?? item.role}</span></td>
                      <td>{item.department || '—'}</td>
                      <td><span className={`admin-status ${item.isActive ? 'is-active' : 'is-inactive'}`}><i />{item.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td><div className="admin-row-actions"><button type="button" className="admin-link-button" onClick={() => setSelectedUser(item)}>Details</button><button type="button" className="admin-link-button" disabled={statusUpdating === id || (id === (user._id ?? user.id) && item.isActive)} onClick={() => handleStatusChange(item)}>{statusUpdating === id ? 'Saving…' : item.isActive ? 'Deactivate' : 'Activate'}</button></div></td>
                    </tr>
                  })}</tbody>
                </table>
              </div>
            )}
          </section>

          <section id="accounts" className="admin-panel admin-section">
            <div className="admin-panel-heading">
              <div><span className="admin-eyebrow">TEAM ACCESS</span><h2>Create a team account</h2><p>Create a team lead or technician account with its dedicated role.</p></div>
            </div>
            <form className="admin-account-form" onSubmit={handleCreateAccount}>
              <div className="admin-form-field admin-form-wide"><label htmlFor="admin-role">Account role</label><select id="admin-role" value={accountRole} onChange={(event) => setAccountRole(event.target.value)}><option value="ICT_TECHNICIAN">ICT Technician</option><option value="ICT_TECHNICIAN_TEAM_LEAD">Technician Team Lead</option></select><small>Team Lead is a separate role. This dashboard does not assign or manage requests.</small></div>
              <div className="admin-form-field"><label htmlFor="admin-name">Full name</label><input id="admin-name" name="fullName" autoComplete="name" required maxLength={120} /></div>
              <div className="admin-form-field"><label htmlFor="admin-email">Email address</label><input id="admin-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
              <div className="admin-form-field"><label htmlFor="admin-phone">Phone</label><input id="admin-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} /></div>
              <div className="admin-form-field"><label htmlFor="admin-department">Department</label><input id="admin-department" name="department" required maxLength={120} /></div>
              <div className="admin-form-field"><label htmlFor="admin-password">Temporary password</label><input id="admin-password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
              <div className="admin-form-field"><label htmlFor="admin-confirm-password">Confirm password</label><input id="admin-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></div>
              {accountError && <p className="admin-form-message error" role="alert">{accountError}</p>}
              {accountSuccess && <p className="admin-form-message success" role="status">{accountSuccess}</p>}
              <div className="admin-form-actions"><button type="submit" className="admin-primary-button" disabled={creating}><Plus size={17} />{creating ? 'Creating account…' : 'Create account'}</button></div>
            </form>
          </section>

          <section id="requests" className="admin-panel admin-section">
            <div className="admin-panel-heading">
              <div><span className="admin-eyebrow">SERVICE ACTIVITY</span><h2>Maintenance requests</h2><p>Request status and priority overview.</p></div>
              <button type="button" className="admin-secondary-button" onClick={() => loadAdminRequests(requestFilters)} disabled={requestsLoading}><RefreshCw size={15} className={requestsLoading ? 'admin-refreshing' : undefined} />{requestsLoading ? 'Loading…' : 'Refresh'}</button>
            </div>
            <div className="admin-request-filters">
              <label>Status<select value={requestFilters.status} onChange={(event) => setRequestFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option>{requestStatuses.map((status) => <option key={status} value={status}>{readableValue(status)}</option>)}</select></label>
              <label>Category<select value={requestFilters.category} onChange={(event) => setRequestFilters((current) => ({ ...current, category: event.target.value }))}><option value="">All categories</option>{requestCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label>Priority<select value={requestFilters.priority} onChange={(event) => setRequestFilters((current) => ({ ...current, priority: event.target.value }))}><option value="">All priorities</option>{requestPriorities.map((priority) => <option key={priority} value={priority}>{readableValue(priority)}</option>)}</select></label>
              <button type="button" className="admin-primary-button" onClick={() => loadAdminRequests(requestFilters)} disabled={requestsLoading}>Apply filters</button>
              <button type="button" className="admin-secondary-button" onClick={() => { const cleared = { status: '', category: '', priority: '' }; setRequestFilters(cleared); loadAdminRequests(cleared) }} disabled={requestsLoading}>Clear</button>
            </div>
            {requestsError && <div className="admin-alert" role="alert"><AlertCircle size={18} /><span>{requestsError} <button type="button" onClick={() => loadAdminRequests(requestFilters)}>Try again</button></span></div>}
            {requestsLoading ? <p className="admin-empty" role="status">Loading maintenance requests…</p> : requestsError ? <p className="admin-empty">Request activity could not be loaded.</p> : maintenanceRequests.length === 0 ? <p className="admin-empty">No maintenance requests match these filters.</p> : (
              <div className="admin-table-wrap">
                <table className="admin-table admin-request-table">
                  <thead><tr><th>REQUEST</th><th>REQUESTER</th><th>LOCATION</th><th>PRIORITY</th><th>STATUS</th><th>SUBMITTED</th></tr></thead>
                  <tbody>{maintenanceRequests.map((item) => {
                    const requesterId = typeof item.requester === 'object' ? item.requester?.id ?? item.requester?._id : item.requester
                    const requester = users.find((candidate) => candidate.id === requesterId)
                    return <tr key={item.id}>
                      <td><strong className="admin-request-title">{item.title}</strong><small className="admin-request-category">{item.category}</small></td>
                      <td>{requester?.fullName ?? 'Staff requester'}</td>
                      <td>{item.building}{item.room ? ` · ${item.room}` : ''}</td>
                      <td><span className={`admin-priority priority-${String(item.priority).toLowerCase()}`}>{readableValue(item.priority)}</span></td>
                      <td><span className={`admin-request-status status-${String(item.status).toLowerCase().replaceAll('_', '-')}`}>{readableValue(item.status)}</span></td>
                      <td>{requestDate(item.createdAt)}</td>
                    </tr>
                  })}</tbody>
                </table>
              </div>
            )}
          </section>

          <section id="profile" className="admin-panel admin-profile admin-section">
            <div className="admin-panel-heading"><div><span className="admin-eyebrow">ACCOUNT</span><h2>Admin profile</h2><p>Your signed-in administrator account.</p></div></div>
            <div className="admin-profile-card"><span className="admin-avatar profile">{initials(user.fullName)}</span><div className="admin-profile-details"><strong>{user.fullName}</strong><span><Mail size={15} />{user.email}</span><small>{roleLabels[user.role]} · {user.department || 'Department not provided'}</small></div><button type="button" className="admin-secondary-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} />{loggingOut ? 'Signing out…' : 'Sign out'}</button></div>
          </section>
          <footer className="admin-footer">Campus ICT Maintenance Request System <span>·</span> Administration</footer>
        </div>
      </section>

      {selectedUser && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedUser(null) }}>
        <section className="admin-user-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-modal-title">
          <button type="button" className="admin-modal-close" onClick={() => setSelectedUser(null)} aria-label="Close user details"><X size={19} /></button>
          <span className="admin-avatar profile">{initials(selectedUser.fullName)}</span>
          <span className="admin-eyebrow">USER ACCOUNT</span>
          <h2 id="admin-user-modal-title">{selectedUser.fullName}</h2>
          <p className="admin-modal-role">{roleLabels[selectedUser.role] ?? selectedUser.role}</p>
          <dl><div><dt>Email</dt><dd>{selectedUser.email}</dd></div><div><dt>Phone</dt><dd>{selectedUser.phone || '—'}</dd></div><div><dt>Department</dt><dd>{selectedUser.department || '—'}</dd></div><div><dt>Account status</dt><dd>{selectedUser.isActive ? 'Active' : 'Inactive'}</dd></div></dl>
          <button type="button" className="admin-secondary-button modal-action" onClick={() => setSelectedUser(null)}>Close details</button>
        </section>
      </div>}
    </main>
  )
}

export default AdminDashboardPage
