import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import { roleHomePath } from '../context/authRoles.js'
import useAuth from '../context/useAuth.js'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

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
          <span className="eyebrow"><span className="eyebrow-dot" /> Campus support, made simple</span>
          <h2>A better campus begins with the little things.</h2>
          <p>Sign in to report an issue, follow its progress, and help keep your campus at its best.</p>
        </div>
        <div className="auth-aside-foot">Campus Maintenance Request System</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <Brand className="auth-mobile-brand" />
          <div className="auth-intro">
            <span className="eyebrow"><span className="eyebrow-dot" /> Welcome back</span>
            <h1>Sign in to your account</h1>
            <p>Enter your university account details to continue.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="login-email">Email address</label>
              <div className="input-wrap">
                <Mail className="field-icon" size={17} aria-hidden="true" />
                <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@university.edu" required />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrap">
                <LockKeyhole className="field-icon" size={17} aria-hidden="true" />
                <input
                  className="has-action"
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
              <label className="checkbox-label"><input name="remember" type="checkbox" /> Remember me</label>
              <a className="text-link" href="mailto:helpdesk@university.edu?subject=Password%20reset">Forgot password?</a>
            </div>
            {error && <div className="form-message error" role="alert"><ShieldCheck size={16} />{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Log in'}
            </button>
          </form>
          <p className="auth-switch">New to CampusCare? <Link to="/register">Create an account</Link></p>
          <Link className="text-link" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 21 }}>
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
