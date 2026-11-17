import { useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import useAuth from '../context/useAuth.js'
import useLanguage from '../context/LanguageContext.jsx'


function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(formData.entries())
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!values.fullName.trim()) nextErrors.fullName = t('errFullName')
    if (!emailPattern.test(values.email)) nextErrors.email = t('errEmail')
    if (!values.phone.trim()) nextErrors.phone = t('errPhone')
    if (!values.department.trim()) nextErrors.department = t('errDepartment')
    if (!values.password || values.password.length < 8) nextErrors.password = t('errPassword')
    if (values.confirmPassword !== values.password) nextErrors.confirmPassword = t('errConfirmPassword')

    setErrors(nextErrors)
    setError('')

    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await register({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        department: values.department,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
      navigate('/login', { replace: true, state: { registered: true } })
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
          <span className="eyebrow"><span className="eyebrow-dot" /> {t('registerAside')}</span>
          <h2>{t('registerAsideTitle')}</h2>
          <p>{t('registerAsideDesc')}</p>
        </div>
        <div className="auth-aside-foot">{t('registerAsideFoot')}</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card register-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Brand className="auth-mobile-brand" />
          </div>
          <div className="auth-intro">
            <span className="eyebrow"><span className="eyebrow-dot" /> {t('getStarted')}</span>
            <h1>{t('createAccountTitle')}</h1>
            <p>{t('createAccountSubtitle')}</p>
          </div>
          <p className="role-note">{t('roleNote')}</p>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field full-width">
              <label htmlFor="register-name">{t('fullNameLabel')}</label>
              <div className="input-wrap">
                <UserRound className="field-icon" size={16} aria-hidden="true" />
                <input id="register-name" name="fullName" type="text" autoComplete="name" placeholder={t('fullNamePlaceholder')} required aria-describedby={errors.fullName ? 'fullName-error' : undefined} />
              </div>
              {fieldError('fullName')}
            </div>
            <div className="form-field full-width">
              <label htmlFor="register-email">{t('emailLabel')}</label>
              <div className="input-wrap">
                <Mail className="field-icon" size={16} aria-hidden="true" />
                <input id="register-email" name="email" type="email" autoComplete="email" placeholder={t('emailPlaceholder')} required aria-describedby={errors.email ? 'email-error' : undefined} />
              </div>
              {fieldError('email')}
            </div>
            <div className="form-field">
              <label htmlFor="register-phone">{t('phoneLabel')}</label>
              <div className="input-wrap">
                <Phone className="field-icon" size={16} aria-hidden="true" />
                <input id="register-phone" name="phone" type="tel" autoComplete="tel" placeholder={t('phonePlaceholder')} required aria-describedby={errors.phone ? 'phone-error' : undefined} />
              </div>
              {fieldError('phone')}
            </div>
            <div className="form-field">
              <label htmlFor="register-department">{t('departmentLabel')}</label>
              <div className="input-wrap">
                <BriefcaseBusiness className="field-icon" size={16} aria-hidden="true" />
                <input id="register-department" name="department" type="text" autoComplete="organization-title" placeholder={t('departmentPlaceholder')} required aria-describedby={errors.department ? 'department-error' : undefined} />
              </div>
              {fieldError('department')}
            </div>
            <div className="form-field">
              <label htmlFor="register-password">{t('passwordLabel')}</label>
              <div className="input-wrap">
                <LockKeyhole className="field-icon" size={16} aria-hidden="true" />
                <input
                  className="has-action"
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('passwordHint')}
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
              <label htmlFor="register-confirm-password">{t('confirmPasswordLabel')}</label>
              <div className="input-wrap">
                <LockKeyhole className="field-icon" size={16} aria-hidden="true" />
                <input
                  className="has-action"
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('confirmPasswordPlaceholder')}
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
              {submitting ? t('creatingAccount') : t('createAccountButton')}
            </button>
          </form>
          <p className="auth-switch">{t('alreadyHaveAccount')} <Link to="/login">{t('logIn')}</Link></p>
          <Link className="text-link" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
            <ArrowLeft size={14} /> {t('backToHome')}
          </Link>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
