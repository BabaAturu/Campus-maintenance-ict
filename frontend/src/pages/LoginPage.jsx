import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import { roleHomePath } from '../context/authRoles.js'
import useAuth from '../context/useAuth.js'
import useLanguage from '../context/LanguageContext.jsx'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.registered === true
  const { t } = useLanguage()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const formData = new FormData(event.currentTarget)
    try {
      const user = await login({
        email: formData.get('email'),
        password: formData.get('password'),
      })
      navigate(roleHomePath(user.role), { replace: true })
    } catch (loginError) {
      setError(loginError.message)
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> {t('loginAside')}</span>
          <h2>{t('loginAsideTitle')}</h2>
          <p>{t('loginAsideDesc')}</p>
        </div>
        <div className="auth-aside-foot">{t('loginAsideFoot')}</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Brand className="auth-mobile-brand" />
          </div>
          <div className="auth-intro">
            <span className="eyebrow"><span className="eyebrow-dot" /> {t('welcomeBack')}</span>
            <h1>{t('signInTitle')}</h1>
            <p>{t('signInSubtitle')}</p>
          </div>
          {justRegistered && (
            <div className="form-message success" role="status" style={{ marginBottom: 8 }}>
              <CheckCircle2 size={16} /> {t('accountCreated')}
            </div>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="login-email">{t('emailLabel')}</label>
              <div className="input-wrap">
                <Mail className="field-icon" size={17} aria-hidden="true" />
                <input id="login-email" name="email" type="email" autoComplete="email" placeholder={t('emailPlaceholder')} required />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="login-password">{t('passwordLabel')}</label>
              <div className="input-wrap">
                <LockKeyhole className="field-icon" size={17} aria-hidden="true" />
                <input
                  className="has-action"
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  required
                />
                <button
                  className="input-action"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className="form-options">
              <label className="checkbox-label"><input name="remember" type="checkbox" /> {t('rememberMe')}</label>
              <Link className="text-link" to="/forgot-password">{t('forgotPassword')}</Link>
            </div>
            {error && <div className="form-message error" role="alert"><ShieldCheck size={16} />{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? t('signingIn') : t('loginButton')}
            </button>
          </form>
          <p className="auth-switch">{t('newToCampusCare')} <Link to="/register">{t('createAnAccount')}</Link></p>
          <Link className="text-link" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 21 }}>
            <ArrowLeft size={14} /> {t('backToHome')}
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
