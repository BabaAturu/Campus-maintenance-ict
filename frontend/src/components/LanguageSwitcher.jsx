import useLanguage from '../context/LanguageContext.jsx'
import { Globe } from 'lucide-react'
import './LanguageSwitcher.css'

function LanguageSwitcher({ className = '' }) {
  const { lang, toggleLang, t } = useLanguage()

  return (
    <button
      type="button"
      className={`lang-switcher ${className}`.trim()}
      onClick={toggleLang}
      aria-label={`Switch to ${t('langName')}`}
      title={`Switch to ${t('langName')}`}
    >
      <Globe size={15} aria-hidden="true" />
      <span>{t('langLabel')}</span>
    </button>
  )
}

export default LanguageSwitcher
