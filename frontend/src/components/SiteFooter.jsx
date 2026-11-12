import Brand from './Brand.jsx'

function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-inner">
        <Brand />
        <p>ICT support for Arba Minch University Main Campus.</p>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
        </nav>
      </div>
    </footer>
  )
}

export default SiteFooter
