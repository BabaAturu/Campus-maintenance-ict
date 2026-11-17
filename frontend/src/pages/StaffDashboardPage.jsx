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
  RefreshCw,
  UserRound,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'
import useLanguage from '../context/LanguageContext.jsx'
import { getApiResourceUrl, requestApi } from '../services/authApi.js'
import { validateRequestFields } from '../services/requestValidation.js'
import './StaffDashboardPage.css'

const categories = [
  'Computer Hardware',
  'Software & Operating System',
  'Network & Internet',
  'Printer & Scanner',
  'Server & Storage',
  'ICT Classroom & Laboratory Equipment',
  'ICT Security & Other Technical Issues',
]

const requestStages = [
  { value: 'SUBMITTED', label: 'statusSubmitted' },
  { value: 'PENDING', label: 'statusPending' },
  { value: 'ASSIGNED', label: 'statusAssigned' },
  { value: 'IN_PROGRESS', label: 'statusInProgress' },
  { value: 'RESOLVED', label: 'statusResolved' },
  { value: 'CLOSED', label: 'statusClosed' },
]

function RequestDataMessage({ loading, error, onRetry, compact = false, t }) {
  if (loading) {
    return <div className={`staff-api-notice${compact ? ' compact' : ''}`} role="status">{t('loadingRequests')}</div>
  }
  if (!error) return null

  return (
    <div className={`staff-api-notice${compact ? ' compact' : ''}`} role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        <strong>{t('unableToLoad')}</strong>
        <p>{error}</p>
        <button type="button" className="staff-text-button" onClick={onRetry}>{t('tryAgain')}</button>
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

function formatDateTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString()
}

function statusLabel(status, t) {
  const statusKey = {
    SUBMITTED: 'statusSubmitted',
    PENDING: 'statusPending',
    ASSIGNED: 'statusAssigned',
    IN_PROGRESS: 'statusInProgress',
    RESOLVED: 'statusResolved',
    CLOSED: 'statusClosed',
    REJECTED: 'statusRejected',
  }[String(status ?? 'SUBMITTED').toUpperCase()]
  return statusKey ? t(statusKey) : formatStatus(status)
}

function RequestList({ requests, compact = false, t }) {
  return (
    <div className={`staff-request-list${compact ? ' compact' : ''}`}>
      {requests.map((request) => (
        <article className="staff-request-item" key={request._id ?? request.id}>
          <div className="request-item-heading">
            <div><h3>{request.title}</h3><span>{request.category}</span></div>
            <span className={`request-status status-${String(request.status ?? 'SUBMITTED').toLowerCase().replaceAll('_', '-')}`}>{statusLabel(request.status, t)}</span>
          </div>
          <div className="request-item-details">
            <span><strong>{t('priority')}</strong> {formatStatus(request.priority)}</span>
            <span><strong>{t('submitted')}</strong> {formatDate(request.createdAt)}</span>
            <span><strong>{t('location')}</strong> {request.building}, {t('room')} {request.room}</span>
            {request.attachmentUrl && <a href={getApiResourceUrl(request.attachmentUrl)} target="_blank" rel="noreferrer">{t('viewAttachment')}</a>}
          </div>
        </article>
      ))}
    </div>
  )
}

function RequestTracking({ requests, loading, error, onRetry, t }) {
  return (
    <section className="staff-panel tracking-panel" aria-label={t('trackRequests')}>
      <div className="panel-heading tracking-heading">
        <div>
          <span className="staff-kicker">{t('trackingUpdates')}</span>
          <h2>{t('trackingListTitle')}</h2>
          <p>{t('trackingAutoRefresh')}</p>
        </div>
        <button className="staff-secondary-button" type="button" onClick={onRetry} disabled={loading}>
          <RefreshCw size={15} aria-hidden="true" className={loading ? 'tracking-refreshing' : undefined} />
          {loading ? t('refreshing') : t('refreshTracking')}
        </button>
      </div>
      <RequestDataMessage loading={loading} error={error} onRetry={onRetry} t={t} />
      {!loading && requests.length === 0 && !error && (
        <p className="staff-requests-empty" role="status">{t('noRequestsYet')}</p>
      )}
      {requests.length > 0 && (
        <div className="staff-request-list">
          {requests.map((request) => {
            const currentStatus = String(request.status ?? 'SUBMITTED').toUpperCase()
            const currentStage = requestStages.findIndex((stage) => stage.value === currentStatus)
            const rejected = currentStatus === 'REJECTED'
            return (
              <article className="staff-request-item tracking-request-item" key={request._id ?? request.id}>
                <div className="request-item-heading">
                  <div><h3>{request.title}</h3><span>{request.category}</span></div>
                  <span className={`request-status status-${currentStatus.toLowerCase().replaceAll('_', '-')}`}>{statusLabel(currentStatus, t)}</span>
                </div>
                <div className="request-item-details">
                  <span><strong>{t('priority')}</strong> {formatStatus(request.priority)}</span>
                  <span><strong>{t('submitted')}</strong> {formatDate(request.createdAt)}</span>
                  <span><strong>{t('location')}</strong> {request.building}, {t('room')} {request.room}</span>
                  <span><strong>{t('lastUpdated')}</strong> {formatDateTime(request.updatedAt ?? request.createdAt)}</span>
                </div>
                {rejected ? (
                  <p className="tracking-rejected-note" role="status">{t('statusRejectedHint')}</p>
                ) : (
                  <div className="tracking-steps-scroll">
                    <ol className="request-tracking-steps" aria-label={t('requestProgress')}>
                      {requestStages.map((stage, index) => {
                        const completed = currentStage >= 0 && index < currentStage
                        const current = index === currentStage
                        return (
                          <li
                            className={`tracking-stage${completed ? ' is-complete' : ''}${current ? ' is-current' : ''}`}
                            key={stage.value}
                            aria-current={current ? 'step' : undefined}
                          >
                            <span className="tracking-stage-marker">{completed ? '✓' : String(index + 1).padStart(2, '0')}</span>
                            <span>{t(stage.label)}</span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function MyRequests({ requests, loading, error, onRetry, t }) {
  return (
    <section className="staff-panel requests-panel" aria-label={t('myRequests')}>
      <RequestDataMessage loading={loading} error={error} onRetry={onRetry} t={t} />
      {!loading && !error && requests.length === 0 && (
        <p className="staff-requests-empty" role="status">{t('noRequestsYet')}</p>
      )}
      {!loading && !error && requests.length > 0 && <RequestList requests={requests} t={t} />}
    </section>
  )
}

function RequestForm({ onSubmitted, t }) {
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
      setFormError(t('highlightedFields'))
      return
    }

    setSubmitting(true)
    try {
      const requestDetails = new FormData()
      requestDetails.append('title', values.title.trim())
      requestDetails.append('category', values.category)
      requestDetails.append('description', values.description.trim())
      requestDetails.append('building', values.building.trim())
      requestDetails.append('room', values.room.trim())
      requestDetails.append('priority', values.priority)
      if (values.attachment instanceof File && values.attachment.size > 0) {
        requestDetails.append('attachment', values.attachment)
      }
      await requestApi.create(requestDetails)
      await onSubmitted()
      form.reset()
      setFieldErrors({})
      setSuccessMessage(t('submitSuccess'))
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
          <span className="staff-kicker">{t('newRequest')}</span>
          <h2 id="request-form-title">{t('requestDetails')}</h2>
        </div>
        <span className="form-required-note">{t('required')}</span>
      </div>
      <form className="staff-request-form" onSubmit={handleSubmit} noValidate>
        <div className="staff-form-field wide">
          <label htmlFor="request-title">{t('requestTitleLabel')} <span>*</span></label>
          <input id="request-title" name="title" maxLength="140" placeholder={t('requestTitlePlaceholder')} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? 'title-error' : undefined} />
          {fieldErrors.title && <small className="field-error" id="title-error">{fieldErrors.title}</small>}
        </div>
        <div className="staff-form-field">
          <label htmlFor="request-category">{t('ictCategoryLabel')} <span>*</span></label>
          <select id="request-category" name="category" defaultValue="" aria-invalid={Boolean(fieldErrors.category)} aria-describedby={fieldErrors.category ? 'category-error' : undefined}>
            <option value="" disabled>{t('selectCategory')}</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          {fieldErrors.category && <small className="field-error" id="category-error">{fieldErrors.category}</small>}
        </div>
        <div className="staff-form-field">
          <label htmlFor="request-priority">{t('priorityLabel')} <span>*</span></label>
          <select id="request-priority" name="priority" defaultValue="" aria-invalid={Boolean(fieldErrors.priority)} aria-describedby={fieldErrors.priority ? 'priority-error' : undefined}>
            <option value="" disabled>{t('selectPriority')}</option>
            <option value="LOW">{t('low')}</option>
            <option value="MEDIUM">{t('medium')}</option>
            <option value="HIGH">{t('high')}</option>
            <option value="URGENT">{t('urgent')}</option>
          </select>
          {fieldErrors.priority && <small className="field-error" id="priority-error">{fieldErrors.priority}</small>}
        </div>
        <div className="staff-form-field">
          <label htmlFor="request-building">{t('buildingLabel')} <span>*</span></label>
          <div className="staff-input-icon"><MapPin size={16} aria-hidden="true" /><input id="request-building" name="building" maxLength="160" placeholder={t('buildingPlaceholder')} aria-invalid={Boolean(fieldErrors.building)} aria-describedby={fieldErrors.building ? 'building-error' : undefined} /></div>
          {fieldErrors.building && <small className="field-error" id="building-error">{fieldErrors.building}</small>}
        </div>
        <div className="staff-form-field">
          <label htmlFor="request-room">{t('roomLabel')} <span>*</span></label>
          <input id="request-room" name="room" maxLength="40" placeholder={t('roomPlaceholder')} aria-invalid={Boolean(fieldErrors.room)} aria-describedby={fieldErrors.room ? 'room-error' : undefined} />
          {fieldErrors.room && <small className="field-error" id="room-error">{fieldErrors.room}</small>}
        </div>
        <div className="staff-form-field wide">
          <label htmlFor="request-description">{t('descriptionLabel')} <span>*</span></label>
          <textarea id="request-description" name="description" rows="5" maxLength="3000" placeholder={t('descriptionPlaceholder')} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? 'description-error' : undefined} />
          {fieldErrors.description && <small className="field-error" id="description-error">{fieldErrors.description}</small>}
        </div>
        <div className="staff-form-field wide">
          <label htmlFor="request-attachment">{t('attachmentLabel')} <span className="optional-label">{t('optional')}</span></label>
          <div className="staff-file-wrap"><Paperclip size={17} aria-hidden="true" /><input id="request-attachment" name="attachment" type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,image/jpeg,image/png,image/gif,image/webp,application/pdf" disabled={submitting} aria-invalid={Boolean(fieldErrors.attachment)} aria-describedby={fieldErrors.attachment ? 'attachment-hint attachment-error' : 'attachment-hint'} /></div>
          <small id="attachment-hint">{t('attachmentHint')}</small>
          {fieldErrors.attachment && <small className="field-error" id="attachment-error">{fieldErrors.attachment}</small>}
        </div>
        {formError && <p className="staff-form-message" role="alert">{formError}</p>}
        {successMessage && <p className="staff-form-message success" role="status">{successMessage}</p>}
        <div className="staff-form-actions wide">
          <button className="staff-primary-button" type="submit" disabled={submitting}>{submitting ? t('submitting') : t('submitButton')} <ArrowUpRight size={16} aria-hidden="true" /></button>
          <button className="staff-secondary-button" type="reset" disabled={submitting} onClick={() => { setFormError(''); setSuccessMessage(''); setFieldErrors({}) }}><X size={15} aria-hidden="true" /> {t('clearForm')}</button>
        </div>
      </form>
    </section>
  )
}

function RequestHistory({ requests, loading, error, onRetry, t }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const filteredRequests = requests.filter((request) => {
    const requestDateValue = new Date(request.createdAt)
    const localDate = Number.isNaN(requestDateValue.getTime())
      ? ''
      : new Date(requestDateValue.getTime() - requestDateValue.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
    return (!statusFilter || String(request.status ?? 'SUBMITTED') === statusFilter)
      && (!categoryFilter || request.category === categoryFilter)
      && (!dateFilter || localDate === dateFilter)
  })

  return (
    <section className="staff-panel unavailable-panel">
      <div className="panel-heading tracking-heading">
        <div><span className="staff-kicker">{t('requestHistory')}</span><h2>{t('historyTitle')}</h2></div>
        <button className="staff-secondary-button" type="button" onClick={onRetry} disabled={loading}>
          <RefreshCw size={15} aria-hidden="true" className={loading ? 'tracking-refreshing' : undefined} />
          {loading ? t('refreshing') : t('refreshTracking')}
        </button>
      </div>
      <RequestDataMessage loading={loading} error={error} onRetry={onRetry} t={t} />
      <div className="history-filters" aria-label="Request history filters">
        <label>{t('status')}<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">{t('allStatuses')}</option>{requestStages.map((stage) => <option key={stage.value} value={stage.value}>{t(stage.label)}</option>)}<option value="REJECTED">{t('statusRejected')}</option></select></label>
        <label>{t('ictCategory')}<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">{t('allCategories')}</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label>{t('date')}<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
      </div>
      {!loading && !error && requests.length === 0 && <p className="staff-requests-empty" role="status">{t('noRequestsYet')}</p>}
      {!loading && !error && requests.length > 0 && filteredRequests.length === 0 && <p className="staff-requests-empty" role="status">{t('noRequestsMatch')}</p>}
      {!loading && !error && filteredRequests.length > 0 && <RequestList requests={filteredRequests} t={t} />}
    </section>
  )
}

function Profile({ user, t }) {
  const profileItems = [
    [t('fullName'), user.fullName],
    [t('email'), user.email],
    [t('phoneNumber'), user.phone],
    [t('department'), user.department],
    [t('role'), user.role],
  ]

  return (
    <section className="staff-panel profile-panel">
      <div className="profile-intro">
        <div className="profile-avatar" aria-hidden="true">{user.fullName?.trim()?.charAt(0)?.toUpperCase() || 'S'}</div>
        <div><span className="staff-kicker">{t('staffAccount')}</span><h2>{user.fullName}</h2><p>{user.department}</p></div>
      </div>
      <dl className="profile-details">
        {profileItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || t('notProvided')}</dd></div>)}
      </dl>
      <p className="profile-note">{t('roleNote2')}</p>
    </section>
  )
}

function StaffDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'submit', label: t('submitIctRequestNav'), icon: FilePlus2 },
    { id: 'requests', label: t('myRequests'), icon: ClipboardList },
    { id: 'tracking', label: t('trackRequests'), icon: Activity },
    { id: 'history', label: t('requestHistory'), icon: FileClock },
    { id: 'profile', label: t('profile'), icon: UserRound },
  ]

  const sectionTitles = {
    dashboard: [t('dashboardTitle'), t('dashboardSubtitle')],
    submit: [t('submitTitle'), t('submitSubtitle')],
    requests: [t('requestsTitle'), t('requestsSubtitle')],
    tracking: [t('trackingTitle'), t('trackingSubtitle')],
    history: [t('historyTitle'), t('historySubtitle')],
    profile: [t('profileTitle'), t('profileSubtitle')],
  }

  const summaryItems = [
    { label: t('totalRequests'), icon: ClipboardList },
    { label: t('pendingRequests'), icon: Clock3 },
    { label: t('inProgress'), icon: Activity },
    { label: t('resolvedRequests'), icon: FileClock },
  ]

  const [title, subtitle] = sectionTitles[activeSection]

  const refreshRequests = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRequestsLoading(true)
    setRequestsError('')
    try {
      const result = await requestApi.myRequests()
      setRequests(result.requests)
    } catch (error) {
      setRequestsError(error.message)
    } finally {
      if (!silent) setRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => refreshRequests(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [refreshRequests])

  useEffect(() => {
    if (activeSection !== 'tracking') return undefined

    const intervalId = window.setInterval(() => refreshRequests({ silent: true }), 30000)
    return () => window.clearInterval(intervalId)
  }, [activeSection, refreshRequests])

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length
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
    if (section === 'tracking') refreshRequests()
    setSidebarOpen(false)
  }

  return (
    <div className="staff-dashboard">
      <aside className={`staff-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <a className="staff-brand" href="/dashboard/staff" aria-label="CampusCare staff dashboard">
          <span className="staff-brand-mark">C</span><span>CampusCare<small>ICT SUPPORT</small></span>
        </a>
        <div className="staff-nav-label">{t('workspace')}</div>
        <nav className="staff-nav" aria-label="Staff dashboard">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`staff-nav-item${activeSection === id ? ' active' : ''}`} aria-current={activeSection === id ? 'page' : undefined} onClick={() => selectSection(id)}>
              <Icon size={18} aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="staff-sidebar-bottom">
          <div className="staff-sidebar-user"><div className="mini-avatar">{user.fullName?.trim()?.charAt(0)?.toUpperCase() || 'S'}</div><div><strong>{user.fullName}</strong><span>{t('staffRequester')}</span></div></div>
          <button type="button" className="staff-logout" onClick={handleLogout} disabled={loggingOut}><LogOut size={17} aria-hidden="true" />{loggingOut ? t('signingOut') : t('logout')}</button>
        </div>
      </aside>
      {sidebarOpen && <button className="staff-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <main className="staff-main">
        <header className="staff-topbar">
          <button className="staff-menu-toggle" type="button" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}><span /><span /><span /></button>
          <div className="staff-breadcrumb">{t('staffWorkspace')} <span>/</span> <strong>{navigation.find((item) => item.id === activeSection)?.label}</strong></div>
          <div className="staff-top-user">
            <span>{user.fullName}</span>
            <div className="mini-avatar">{user.fullName?.trim()?.charAt(0)?.toUpperCase() || 'S'}</div>
          </div>
        </header>
        <div className="staff-content">
          <div className="staff-page-heading">
            <div><span className="staff-kicker">{t('campusIctServices')}</span><h1>{title}</h1><p>{subtitle}</p></div>
            {activeSection === 'dashboard' && <button className="staff-primary-button" type="button" onClick={() => selectSection('submit')}><FilePlus2 size={16} aria-hidden="true" /> {t('submitARequest')}</button>}
          </div>
          {logoutError && <div className="staff-form-message" role="alert">{logoutError}</div>}
          {activeSection === 'dashboard' && (
            <>
              <RequestDataMessage loading={requestsLoading} error={requestsError} onRetry={refreshRequests} t={t} />
              <section className="staff-summary-grid" aria-label="Request summary">
                {summaryItems.map(({ label, icon: Icon }, index) => <article className="staff-summary-card" key={label}><span className={`summary-icon summary-icon-${index}`}><Icon size={19} aria-hidden="true" /></span><span className="summary-label">{label}</span><strong>{requestsLoading || requestsError ? '—' : summaryValues[index]}</strong><small>{requestsLoading ? t('loadingRequestData') : requestsError ? t('requestDataUnavailable') : t('basedOnYourRequests')}</small></article>)}
              </section>
              <section className="staff-lower-grid">
                <div className="staff-panel recent-panel"><div className="panel-heading"><div><span className="staff-kicker">{t('activity')}</span><h2>{t('recentRequests')}</h2></div><button type="button" className="staff-text-button" onClick={() => selectSection('requests')}>{t('viewAll')} <ArrowUpRight size={15} /></button></div>{requestsLoading || requestsError ? <RequestDataMessage loading={requestsLoading} error={requestsError} onRetry={refreshRequests} compact t={t} /> : requests.length ? <RequestList requests={requests.slice(0, 3)} compact t={t} /> : <p className="staff-requests-empty">{t('noRequestsYet')}</p>}</div>
                <div className="staff-panel quick-panel"><span className="staff-kicker">{t('quickAccess')}</span><h2>{t('whatDoYouNeed')}</h2><button type="button" onClick={() => selectSection('submit')}><FilePlus2 size={17} />{t('startNewRequest')}<ArrowUpRight size={15} /></button><button type="button" onClick={() => selectSection('tracking')}><Activity size={17} />{t('trackExistingRequest')}<ArrowUpRight size={15} /></button></div>
              </section>
            </>
          )}
          {activeSection === 'submit' && <RequestForm onSubmitted={refreshRequests} t={t} />}
          {activeSection === 'requests' && <MyRequests requests={requests} loading={requestsLoading} error={requestsError} onRetry={refreshRequests} t={t} />}
          {activeSection === 'tracking' && <RequestTracking requests={requests} loading={requestsLoading} error={requestsError} onRetry={refreshRequests} t={t} />}
          {activeSection === 'history' && <RequestHistory requests={requests} loading={requestsLoading} error={requestsError} onRetry={refreshRequests} t={t} />}
          {activeSection === 'profile' && <Profile user={user} t={t} />}
          <footer className="staff-footer">{t('campusCareFooter')} <span>·</span> {t('footerTagline')}</footer>
        </div>
      </main>
    </div>
  )
}

export default StaffDashboardPage
