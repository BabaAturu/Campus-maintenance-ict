import Brand from './Brand.jsx'
import useLanguage from '../context/LanguageContext.jsx'

function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-inner">
        <Brand />
        <p>{t('heroProof')}</p>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="#about">{t('about')}</a>
          <a href="#services">{t('services')}</a>
          <a href="#how-it-works">{t('howTitle')}</a>
        </nav>
      </div>
    </footer>
  )
}

export default SiteFooter
