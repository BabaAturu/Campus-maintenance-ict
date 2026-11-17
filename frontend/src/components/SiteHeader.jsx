import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from './Brand.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import useLanguage from '../context/LanguageContext.jsx'

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useLanguage()

  const links = [
    { label: t('home'), href: '#home' },
    { label: t('about'), href: '#about' },
    { label: t('services'), href: '#services' },
    { label: t('contact'), href: '#contact' },
  ]

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Brand />
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <nav
          className={`nav-links${menuOpen ? ' is-open' : ''}`}
          id="primary-navigation"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <LanguageSwitcher className="light" />
          <Link className="button button-outline" to="/login">
            {t('logIn')}
          </Link>
          <Link className="button button-primary" to="/register">
            {t('register')}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
