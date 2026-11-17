import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { translations } from '../i18n/translations.js'

const LanguageContext = createContext()

const STORAGE_KEY = 'campuscare-lang'

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = useCallback((newLang) => {
    setLangState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
    } catch { /* ignore */ }
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'am' : 'en')
  }, [lang, setLang])

  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations.en?.[key] ?? key
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export default function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}
