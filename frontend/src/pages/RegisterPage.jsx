import { useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import { roleHomePath } from '../context/authRoles.js'
import useAuth from '../context/useAuth.js'

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(formData.entries())
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!values.fullName.trim()) nextErrors.fullName = 'Enter your full name.'
    if (!emailPattern.test(values.email)) nextErrors.email = 'Enter a valid email address.'
    if (!values.phone.trim()) nextErrors.phone = 'Enter your phone number.'
    if (!values.department.trim()) nextErrors.department = 'Enter your department.'
    if (!values.password || values.password.length < 8) nextErrors.password = 'Use at least 8 characters for your password.'
    if (values.confirmPassword !== values.password) nextErrors.confirmPassword = 'Passwords do not match.'

    setErrors(nextErrors)
    setError('')

    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const user = await register({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        department: values.department,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
      navigate(roleHomePath(user.role), { replace: true })
    } catch (registrationError) {
      setError(registrationError.message)
      setSubmitting(false)
    }
  }

  function fieldError(name) {
    return errors[name] ? <span className="password-hint" id={`${name}-error`} role="alert">{errors[name]}</span> : null
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Join your campus community</span>
          <h2>Help us make campus a better place.</h2>
          <p>Create an account to share maintenance concerns and stay informed as your requests are handled.</p>
        </div>
        <div className="auth-aside-foot">A clear path from report to resolution.</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card register-card">
          <Brand className="auth-mobile-brand" />
          <div className="auth-intro">
            <span className="eyebrow"><span className="eyebrow-dot" /> Get started</span>
            <h1>Create your account</h1>
            <p>Register with your university details to get started.</p>
          </div>
          <p className="role-note">Public accounts are automatically registered as Staff.</p>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field full-width">
              <label htmlFor="register-name">Full name</label>
              <div className="input-wrap">
                <UserRound className="field-icon" size={16} aria-hidden="true" />
                <input id="register-name" name="fullName" type="text" autoComplete="name" placeholder="Your full name" required aria-describedby={errors.fullName ? 'fullName-error' : undefined} />
              </div>
              {fieldError('fullName')}
            </div>
            <div className="form-field full-width">
              <label htmlFor="register-email">Email address</label>
              <div className="input-wrap">
                <Mail className="field-icon" size={16} aria-hidden="true" />
                <input id="register-email" name="email" type="email" autoComplete="email" placeholder="you@university.edu" required aria-describedby={errors.email ? 'email-error' : undefined} />
              </div>
              {fieldError('email')}
            </div>
            <div className="form-field">
              <label htmlFor="register-phone">Phone number</label>
              <div className="input-wrap">
                <Phone className="field-icon" size={16} aria-hidden="true" />
                <input id="register-phone" name="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" required aria-describedby={errors.phone ? 'phone-error' : undefined} />
              </div>
              {fieldError('phone')}
            </div>
            <div className="form-field">
              <label htmlFor="register-department">Department</label>
              <div className="input-wrap">
                <BriefcaseBusiness className="field-icon" size={16} aria-hidden="true" />
                <input id="register-department" name="department" type="text" autoComplete="organization-title" placeholder="Your department" required aria-describedby={errors.department ? 'department-error' : undefined} />
              </div>
              {fieldError('department')}
            </div>
            <div className="form-field">
              <label htmlFor="register-password">Password</label>
              <div className="input-wrap">
                <LockKeyhole className="field-icon" size={16} aria-hidden="true" />
                <input
                  className="has-action"
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button className="input-action" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldError('password')}
            </div>
            <div className="form-field">
              <label htmlFor="register-confirm-password">Confirm password</label>
              <div className="input-wrap">
                <LockKeyhole className="field-icon" size={16} aria-hidden="true" />
                <input
                  className="has-action"
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  required
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                <button className="input-action" type="button" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} onClick={() => setShowConfirmPassword((visible) => !visible)}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldError('confirmPassword')}
            </div>
            {error && <div className="form-message error" role="alert"><CheckCircle2 size={16} />{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
          <Link className="text-link" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
