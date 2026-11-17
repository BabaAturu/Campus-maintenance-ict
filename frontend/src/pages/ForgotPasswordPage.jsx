import { useState } from 'react'
import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import useLanguage from '../context/LanguageContext.jsx'
import { authApi } from '../services/authApi.js'

function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleRequestCode(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const submittedEmail = String(formData.get('email') ?? '').trim()

    try {
      await authApi.requestPasswordReset(submittedEmail)
      setEmail(submittedEmail)
      setStep('verify')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await authApi.verifyPasswordResetOtp(email, otp)
      setResetToken(result.resetToken)
      setStep('password')
    } catch (verificationError) {
      setError(verificationError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')
    const passwordBytes = new TextEncoder().encode(password).length

    if (password.length < 8 || passwordBytes > 72 || password !== confirmPassword) {
      setError(t('invalidResetPassword'))
      return
    }

    setSubmitting(true)
    try {
      await authApi.resetPassword({ email, resetToken, password, confirmPassword })
      setResetToken('')
      setStep('complete')
    } catch (resetError) {
      setError(resetError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function changeEmail() {
    setError('')
    setOtp('')
    setResetToken('')
    setStep('email')
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> {t('passwordResetAside')}</span>
          <h2>{t('passwordResetAsideTitle')}</h2>
          <p>{t('passwordResetAsideDescription')}</p>
        </div>
        <div className="auth-aside-foot">{t('passwordResetAsideFoot')}</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-heading">
            <Brand className="auth-mobile-brand" />
          </div>
          <div className="auth-intro">
            <span className="eyebrow"><span className="eyebrow-dot" />{t('passwordResetAside')}</span>
            <h1>{t('forgotPasswordTitle')}</h1>
            <p>{t('forgotPasswordSubtitle')}</p>
          </div>

          {step === 'email' && (
            <form className="auth-form" onSubmit={handleRequestCode}>
              <div className="form-field">
                <label htmlFor="reset-email">{t('emailLabel')}</label>
                <div className="input-wrap">
                  <Mail className="field-icon" size={17} aria-hidden="true" />
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('emailPlaceholder')}
                    required
                    maxLength={254}
                  />
                </div>
              </div>
              {error && <div className="form-message error" role="alert">{error}</div>}
              <p className="password-reset-note">{t('resetEmailHint')}</p>
              <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
                {submitting ? t('sendingResetCode') : t('requestResetCode')}
              </button>
            </form>
          )}

          {step === 'verify' && (
            <form className="auth-form" onSubmit={handleVerifyCode}>
              <div className="form-message" role="status">{t('resetCodeSent')}</div>
              <div className="form-field">
                <label htmlFor="reset-otp">{t('verificationCodeLabel')}</label>
                <div className="input-wrap">
                  <KeyRound className="field-icon" size={17} aria-hidden="true" />
                  <input
                    className="otp-input"
                    id="reset-otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder={t('verificationCodePlaceholder')}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>
              </div>
              {error && <div className="form-message error" role="alert">{error}</div>}
              <button className="button button-primary auth-submit" type="submit" disabled={submitting || otp.length !== 6}>
                {submitting ? t('verifyingCode') : t('verifyCode')}
              </button>
              <button className="text-link password-reset-link-button" type="button" onClick={changeEmail}>
                {t('changeEmail')}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="form-field">
                <label htmlFor="reset-new-password">{t('newPasswordLabel')}</label>
                <input
                  id="reset-new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="reset-confirm-password">{t('confirmNewPasswordLabel')}</label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
              {error && <div className="form-message error" role="alert">{error}</div>}
              <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
                {submitting ? t('resettingPassword') : t('resetPasswordButton')}
              </button>
            </form>
          )}

          {step === 'complete' && (
            <div className="form-message success password-reset-success" role="status">
              {t('resetPasswordSuccess')}
            </div>
          )}

          <Link className="text-link password-reset-back" to="/login">
            <ArrowLeft size={14} aria-hidden="true" /> {t('loginButton')}
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
