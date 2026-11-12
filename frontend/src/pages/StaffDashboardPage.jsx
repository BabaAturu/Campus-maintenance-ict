import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  ClipboardList,
  Clock3,
  FileClock,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  MapPin,
  Paperclip,
  UserRound,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'
import { requestApi } from '../services/authApi.js'
import { validateRequestFields } from '../services/requestValidation.js'
import './StaffDashboardPage.css'

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'submit', label: 'Submit ICT Request', icon: FilePlus2 },
  { id: 'requests', label: 'My Requests', icon: ClipboardList },
  { id: 'tracking', label: 'Track Requests', icon: Activity },
  { id: 'history', label: 'Request History', icon: FileClock },
  { id: 'profile', label: 'Profile', icon: UserRound },
]

const categories = [
  'Computer Hardware',
  'Software & Operating System',
  'Network & Internet',
  'Printer & Scanner',
  'Server & Storage',
  'ICT Classroom & Laboratory Equipment',
  'ICT Security & Other Technical Issues',
]

const statuses = ['Submitted', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected']

const summaryItems = [
  { label: 'Total Requests', icon: ClipboardList },
  { label: 'Pending Requests', icon: Clock3 },
  { label: 'In Progress', icon: Activity },
  { label: 'Resolved Requests', icon: FileClock },
]

const sectionTitles = {
  dashboard: ['Your support overview', 'Here is the latest on your ICT support requests.'],
  submit: ['Submit an ICT request', 'Tell the ICT support team what you need help with.'],
  requests: ['My requests', 'Requests submitted from your staff account.'],
  tracking: ['Track requests', 'Follow the progress of requests linked to your account.'],
  history: ['Request history', 'Review and filter your previously submitted requests.'],
  profile: ['Your profile', 'Account details linked to your authenticated session.'],
}

function RequestDataMessage({ loading, error, onRetry, compact = false }) {
  if (loading) {
    return <div className={`staff-api-notice${compact ? ' compact' : ''}`} role="status">Loading your requests…</div>
  }
  if (!error) return null

  return (
    <div className={`staff-api-notice${compact ? ' compact' : ''}`} role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        <strong>Unable to load request data</strong>
        <p>{error}</p>
        <button type="button" className="staff-text-button" onClick={onRetry}>Try again</button>
      </div>
    </div>
  )
}

function formatStatus(status) {
  return String(status ?? 'SUBMITTED')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString()
}

function RequestList({ requests, compact = false }) {
  return (
    <div className={`staff-request-list${compact ? ' compact' : ''}`}>
      {requests.map((request) => (
        <article className="staff-request-item" key={request._id ?? request.id}>
          <div className="request-item-heading">
            <div><h3>{request.title}</h3><span>{request.category}</span></div>
            <span className={`request-status status-${String(request.status ?? 'SUBMITTED').toLowerCase().replaceAll('_', '-')}`}>{formatStatus(request.status)}</span>
          </div>
          <div className="request-item-details">
            <span><strong>Priority</strong> {formatStatus(request.priority)}</span>
            <span><strong>Submitted</strong> {formatDate(request.createdAt)}</span>
            <span><strong>Location</strong> {request.building}, Room {request.room}</span>
          </div>
        </article>
      ))}
    </div>
  )
}

function MyRequests({ requests, loading, error, onRetry }) {
  return (
    <section className="staff-panel requests-panel" aria-label="My requests">
      <RequestDataMessage loading={loading} error={error} onRetry={onRetry} />
      {!loading && !error && requests.length === 0 && (
        <p className="staff-requests-empty" role="status">You have not submitted any requests yet.</p>
      )}
      {!loading && !error && requests.length > 0 && <RequestList requests={requests} />}
    </section>
  )
}

function RequestForm({ onSubmitted }) {
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const values = Object.fromEntries(formData.entries())
    const nextErrors = validateRequestFields(values)

    setFieldErrors(nextErrors)
    setFormError('')
    setSuccessMessage('')
    if (Object.keys(nextErrors).length) {
      setFormError('Complete the highlighted required fields before continuing.')
      return
    }

    setSubmitting(true)
    try {
      await requestApi.create({
        title: values.title.trim(),
        category: values.category,
        description: values.description.trim(),
        building: values.building.trim(),
        room: values.room.trim(),
        priority: values.priority,
      })
      await onSubmitted()
      form.reset()
      setFieldErrors({})
      setSuccessMessage('Your request was submitted successfully.')
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="staff-panel request-panel" aria-labelledby="request-form-title">
      <div className="panel-heading">
        <div>
          <span className="staff-kicker">NEW REQUEST</span>
          <h2 id="request-form-title">Request details</h2>
        </div>
        <span className="form-required-note">* Required</span>
      </div>
      <form className="staff-request-form" onSubmit={handleSubmit} noValidate>
        <div className="staff-form-field wide">
          <label htmlFor="request-title">Request title <span>*</span></label>
          <input id="request-title" name="title" maxLength="140" placeholder="Briefly describe the issue" aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? 'title-error' : undefined} />
          {fieldErrors.title && <small className="field-error" id="title-error">{fieldErrors.title}</small>}
        </div>
        <div className="staff-form-field">
          <label htmlFor="request-category">ICT category <span>*</span></label>
          <select id="request-category" name="category" defaultValue="" aria-invalid={Boolean(fieldErrors.category)} aria-describedby={fieldErrors.category ? 'category-error' : undefined}>
            <option value="" disabled>Select a category</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          {fieldErrors.category && <small className="field-error" id="category-error">{fieldErrors.category}</small>}
        </div>
        <div className="staff-form-field">
          <label htmlFor="request-priority">Priority <span>*</span></label>
          <select id="request-priority" name="priority" defaultValue="" aria-invalid={Boolean(fieldErrors.priority)} aria-describedby={fieldErrors.priority ? 'priority-error' : undefined}>
            <option value="" disabled>Select priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          {fieldErrors.priority && <small className="field-error" id="priority-error">{fieldErrors.priority}</small>}
        </div>
        <div className="staff-form-field">
          <label htmlFor="request-building">Campus building / location <span>*</span></label>
          <div className="staff-input-icon"><MapPin size={16} aria-hidden="true" /><input id="request-building" name="building" maxLength="160" placeholder="Building or campus location" aria-invalid={Boolean(fieldErrors.building)} aria-describedby={fieldErrors.building ? 'building-error' : undefined} /></div>
          {fieldErrors.building && <small className="field-error" id="building-error">{fieldErrors.building}</small>}
        </div>
        <div className="staff-form-field">
          <label htmlFor="request-room">Room number <span>*</span></label>
          <input id="request-room" name="room" maxLength="40" placeholder="e.g. Room 204" aria-invalid={Boolean(fieldErrors.room)} aria-describedby={fieldErrors.room ? 'room-error' : undefined} />
          {fieldErrors.room && <small className="field-error" id="room-error">{fieldErrors.room}</small>}
        </div>
        <div className="staff-form-field wide">
          <label htmlFor="request-description">Description <span>*</span></label>
          <textarea id="request-description" name="description" rows="5" maxLength="3000" placeholder="Include what happened, any error messages, and when the issue started." aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? 'description-error' : undefined} />
          {fieldErrors.description && <small className="field-error" id="description-error">{fieldErrors.description}</small>}
        </div>
        <div className="staff-form-field wide">
          <label htmlFor="request-attachment">Image attachment <span className="optional-label">Optional</span></label>
          <div className="staff-file-wrap"><Paperclip size={17} aria-hidden="true" /><input id="request-attachment" name="attachment" type="file" accept="image/*" disabled aria-describedby="attachment-hint" /></div>
          <small id="attachment-hint">Image uploads are not supported yet.</small>
          {fieldErrors.attachment && <small className="field-error" id="attachment-error">{fieldErrors.attachment}</small>}
        </div>
        {formError && <p className="staff-form-message" role="alert">{formError}</p>}
        {successMessage && <p className="staff-form-message success" role="status">{successMessage}</p>}
        <div className="staff-form-actions wide">
          <button className="staff-primary-button" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'} <ArrowUpRight size={16} aria-hidden="true" /></button>
          <button className="staff-secondary-button" type="reset" disabled={submitting} onClick={() => { setFormError(''); setSuccessMessage(''); setFieldErrors({}) }}><X size={15} aria-hidden="true" /> Clear form</button>
        </div>
      </form>
    </section>
  )
}

function RequestsUnavailable({ section }) {
  return (
    <section className="staff-panel unavailable-panel">
      <div className="staff-api-notice" role="status">
        <AlertCircle size={18} aria-hidden="true" />
        <div><strong>This view is not available yet</strong><p>Your submitted requests are available in My Requests.</p></div>
      </div>
      {section === 'history' && (
        <div className="history-filters" aria-label="Request history filters">
          <label>Status<select disabled><option>All statuses</option></select></label>
          <label>ICT category<select disabled><option>All categories</option></select></label>
          <label>Date<input type="date" disabled /></label>
        </div>
      )}
      {section === 'tracking' && (
        <div className="status-list" aria-label="Supported request statuses">
          {statuses.map((status, index) => <span key={status}><i>{String(index + 1).padStart(2, '0')}</i>{status}</span>)}
          <p>Request-specific timelines and rejection reasons require request details from the backend.</p>
        </div>
      )}
    </section>
  )
}

function Profile({ user }) {
  const profileItems = [
    ['Full Name', user.fullName],
    ['Email', user.email],
    ['Phone Number', user.phone],
    ['Department', user.department],
    ['Role', user.role],
  ]

  return (
    <section className="staff-panel profile-panel">
      <div className="profile-intro">
        <div className="profile-avatar" aria-hidden="true">{user.fullName?.trim()?.charAt(0)?.toUpperCase() || 'S'}</div>
        <div><span className="staff-kicker">STAFF ACCOUNT</span><h2>{user.fullName}</h2><p>{user.department}</p></div>
      </div>
      <dl className="profile-details">
        {profileItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}
      </dl>
      <p className="profile-note">Your role is managed by an ICT Admin and cannot be changed here.</p>
    </section>
  )
}

function StaffDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [title, subtitle] = sectionTitles[activeSection]

  const refreshRequests = useCallback(async () => {
    setRequestsLoading(true)
    setRequestsError('')
    try {
      const result = await requestApi.myRequests()
      setRequests(result.requests)
    } catch (error) {
      setRequestsError(error.message)
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshRequests()
  }, [refreshRequests])

  const pendingCount = requests.filter((request) => ['SUBMITTED', 'PENDING'].includes(request.status)).length
  const inProgressCount = requests.filter((request) => ['ASSIGNED', 'IN_PROGRESS'].includes(request.status)).length
  const resolvedCount = requests.filter((request) => ['RESOLVED', 'CLOSED'].includes(request.status)).length
  const summaryValues = [requests.length, pendingCount, inProgressCount, resolvedCount]

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

  function selectSection(section) {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  return (
    <div className="staff-dashboard">
      <aside className={`staff-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <a className="staff-brand" href="/dashboard/staff" aria-label="CampusCare staff dashboard">
          <span className="staff-brand-mark">C</span><span>CampusCare<small>ICT SUPPORT</small></span>
        </a>
        <div className="staff-nav-label">WORKSPACE</div>
        <nav className="staff-nav" aria-label="Staff dashboard">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`staff-nav-item${activeSection === id ? ' active' : ''}`} aria-current={activeSection === id ? 'page' : undefined} onClick={() => selectSection(id)}>
              <Icon size={18} aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="staff-sidebar-bottom">
          <div className="staff-sidebar-user"><div className="mini-avatar">{user.fullName?.trim()?.charAt(0)?.toUpperCase() || 'S'}</div><div><strong>{user.fullName}</strong><span>Staff requester</span></div></div>
          <button type="button" className="staff-logout" onClick={handleLogout} disabled={loggingOut}><LogOut size={17} aria-hidden="true" />{loggingOut ? 'Signing out…' : 'Logout'}</button>
        </div>
      </aside>
      {sidebarOpen && <button className="staff-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <main className="staff-main">
        <header className="staff-topbar">
          <button className="staff-menu-toggle" type="button" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}><span /><span /><span /></button>
          <div className="staff-breadcrumb">Staff workspace <span>/</span> <strong>{navigation.find((item) => item.id === activeSection)?.label}</strong></div>
          <div className="staff-top-user"><span>{user.fullName}</span><div className="mini-avatar">{user.fullName?.trim()?.charAt(0)?.toUpperCase() || 'S'}</div></div>
        </header>
        <div className="staff-content">
          <div className="staff-page-heading">
            <div><span className="staff-kicker">CAMPUS ICT SERVICES</span><h1>{title}</h1><p>{subtitle}</p></div>
            {activeSection === 'dashboard' && <button className="staff-primary-button" type="button" onClick={() => selectSection('submit')}><FilePlus2 size={16} aria-hidden="true" /> Submit a request</button>}
          </div>
          {logoutError && <div className="staff-form-message" role="alert">{logoutError}</div>}
          {activeSection === 'dashboard' && (
            <>
              <RequestDataMessage loading={requestsLoading} error={requestsError} onRetry={refreshRequests} />
              <section className="staff-summary-grid" aria-label="Request summary">
                {summaryItems.map(({ label, icon: Icon }, index) => <article className="staff-summary-card" key={label}><span className={`summary-icon summary-icon-${index}`}><Icon size={19} aria-hidden="true" /></span><span className="summary-label">{label}</span><strong>{requestsLoading || requestsError ? '—' : summaryValues[index]}</strong><small>{requestsLoading ? 'Loading request data' : requestsError ? 'Request data unavailable' : 'Based on your requests'}</small></article>)}
              </section>
              <section className="staff-lower-grid">
                <div className="staff-panel recent-panel"><div className="panel-heading"><div><span className="staff-kicker">ACTIVITY</span><h2>Recent requests</h2></div><button type="button" className="staff-text-button" onClick={() => selectSection('requests')}>View all <ArrowUpRight size={15} /></button></div>{requestsLoading || requestsError ? <RequestDataMessage loading={requestsLoading} error={requestsError} onRetry={refreshRequests} compact /> : requests.length ? <RequestList requests={requests.slice(0, 3)} compact /> : <p className="staff-requests-empty">No requests submitted yet.</p>}</div>
                <div className="staff-panel quick-panel"><span className="staff-kicker">QUICK ACCESS</span><h2>What do you need?</h2><button type="button" onClick={() => selectSection('submit')}><FilePlus2 size={17} />Start a new request<ArrowUpRight size={15} /></button><button type="button" onClick={() => selectSection('tracking')}><Activity size={17} />Track an existing request<ArrowUpRight size={15} /></button></div>
              </section>
            </>
          )}
          {activeSection === 'submit' && <RequestForm onSubmitted={refreshRequests} />}
          {activeSection === 'requests' && <MyRequests requests={requests} loading={requestsLoading} error={requestsError} onRetry={refreshRequests} />}
          {(activeSection === 'tracking' || activeSection === 'history') && <RequestsUnavailable section={activeSection} />}
          {activeSection === 'profile' && <Profile user={user} />}
          <footer className="staff-footer">CampusCare <span>·</span> Campus ICT Maintenance Request System</footer>
        </div>
      </main>
    </div>
  )
}

export default StaffDashboardPage