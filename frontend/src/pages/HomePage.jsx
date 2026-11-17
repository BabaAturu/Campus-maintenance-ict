import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Laptop,
  Monitor,
  Network,
  Printer,
  Projector,
  Server,
  ShieldCheck,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import useLanguage from '../context/LanguageContext.jsx'
import './HomePage.css'

const revealVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const MotionLink = motion(Link)
const Laptop3DExperience = lazy(() => import('../components/Laptop3DExperience.jsx'))

const laptopViews = [
  '/des1.png',
  '/des2.jpeg',
  '/des3.jpeg',
  '/des4.jpeg',
]

const serviceKeys = [
  { titleKey: 'svcHardwareTitle', descKey: 'svcHardwareDesc', icon: Laptop },
  { titleKey: 'svcSoftwareTitle', descKey: 'svcSoftwareDesc', icon: Monitor },
  { titleKey: 'svcNetworkTitle', descKey: 'svcNetworkDesc', icon: Network, image: '/network-switch.png' },
  { titleKey: 'svcPrinterTitle', descKey: 'svcPrinterDesc', icon: Printer, image: '/printer.png' },
  { titleKey: 'svcServerTitle', descKey: 'svcServerDesc', icon: Server },
  { titleKey: 'svcClassroomTitle', descKey: 'svcClassroomDesc', icon: Projector },
  { titleKey: 'svcSecurityTitle', descKey: 'svcSecurityDesc', icon: ShieldCheck },
]

const stepKeys = [
  { titleKey: 'step1Title', descKey: 'step1Desc', icon: ClipboardList },
  { titleKey: 'step2Title', descKey: 'step2Desc', icon: Network },
  { titleKey: 'step3Title', descKey: 'step3Desc', icon: CheckCircle2 },
]

function LaptopSlideshow({ reducedMotion }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [imagesReady, setImagesReady] = useState(false)

  useEffect(() => {
    let active = true
    let intervalId
    const preloaders = []

    const preloadView = (source) => new Promise((resolve) => {
      const image = new Image()
      preloaders.push(image)
      const finish = () => {
        image.onload = null
        image.onerror = null
        resolve()
      }
      image.onload = finish
      image.onerror = finish
      image.src = source
      if (image.complete) finish()
    })

    Promise.all(laptopViews.map(preloadView)).then(() => {
      if (!active) return
      setImagesReady(true)
      intervalId = window.setInterval(() => {
        setActiveIndex((index) => (index + 1) % laptopViews.length)
      }, 2000)
    })

    return () => {
      active = false
      window.clearInterval(intervalId)
      preloaders.forEach((image) => {
        image.onload = null
        image.onerror = null
      })
    }
  }, [])

  return (
    <div className={`laptop-slideshow${reducedMotion ? ' reduced-motion' : ''}`} role="group" aria-label="Automatic laptop image slideshow">
      {!imagesReady ? (
        <img className="laptop-slideshow-image laptop-slideshow-fallback" src="/laptop.png" alt="Laptop computer" />
      ) : (
        <img
          key={laptopViews[activeIndex]}
          className="laptop-slideshow-image"
          src={laptopViews[activeIndex]}
          alt={`Laptop product image ${activeIndex + 1} of ${laptopViews.length}`}
          decoding="async"
          fetchPriority="high"
        />
      )}
    </div>
  )
}

function IctIllustration({ reducedMotion }) {
  const [show3D, setShow3D] = useState(false)
  const { t } = useLanguage()

  return (
    <div className="hero-visual">
      <div className="ict-art">
        {show3D ? (
          <Suspense fallback={<img className="laptop-scene-fallback" src="/laptop.png" alt="Laptop computer" />}>
            <Laptop3DExperience reducedMotion={reducedMotion} />
          </Suspense>
        ) : (
          <LaptopSlideshow reducedMotion={reducedMotion} />
        )}
        <button
          className="laptop-scene-mode-button"
          type="button"
          aria-pressed={show3D}
          onClick={() => setShow3D((active) => !active)}
        >
          {show3D ? t('showImageViews') : t('view3DModel')}
        </button>
      </div>
      <div className="request-card">
        <div className="request-card-top">
          <span>{t('campusIctSupport')}</span>
          <span className="request-card-icon"><Monitor size={15} /></span>
        </div>
        <h3>{t('computerNetworkHelp')}</h3>
        <p>{t('arbaMinchUniversity')}</p>
        <div className="request-card-status">
          <span>{t('mainCampus')}</span>
          <span className="status-pill">{t('campusCare')}</span>
        </div>
      </div>
      <div className="floating-note">
        <span className="floating-note-icon"><Check size={16} /></span>
        <span><strong>{t('ictSupport')}</strong><small>{t('teachingLearningResearch')}</small></span>
      </div>
    </div>
  )
}

function HomePage() {
  const reducedMotion = useReducedMotion()
  const { t } = useLanguage()

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero-section" id="home">
          <div className="container hero-grid">
            <motion.div
              className="hero-copy"
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.65, ease: 'easeOut' }}
            >
              <span className="eyebrow"><span className="eyebrow-dot" /> {t('heroEyebrow')}</span>
              <h1>{t('heroTitle')}</h1>
              <p>{t('heroDescription')}</p>
              <div className="hero-actions">
                <MotionLink className="button button-primary button-large" to="/login" whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
                  {t('submitIctRequest')} <ArrowRight size={16} />
                </MotionLink>
                <MotionLink className="button button-outline button-large" to="/register" whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
                  {t('register')}
                </MotionLink>
              </div>
              <div className="hero-proof">
                <span className="hero-proof-icon"><ShieldCheck size={17} /></span>
                <span>{t('heroProof')}</span>
              </div>
            </motion.div>
            <IctIllustration reducedMotion={reducedMotion} />
          </div>
        </section>

        <section className="section" id="services">
          <div className="container">
            <motion.div className="section-heading" variants={revealVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.35 }} transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}>
              <span className="eyebrow"><span className="eyebrow-dot" /> {t('servicesEyebrow')}</span>
              <h2>{t('servicesTitle')}</h2>
              <p>{t('servicesSubtitle')}</p>
            </motion.div>
            <motion.div className="service-grid" variants={staggerVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.14 }}>
              {serviceKeys.map(({ titleKey, descKey, icon: Icon, image }) => (
                <motion.article
                  className="service-card"
                  key={titleKey}
                  variants={revealVariants}
                  transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
                  whileHover={reducedMotion ? undefined : { y: -7, rotateX: -2, rotateY: 1.5, scale: 1.015 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.99 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {image ? (
                    <div className={`service-image service-image-${titleKey.includes('Network') ? 'network' : 'printer'}`}>
                      <img src={image} alt="" loading="lazy" decoding="async" />
                    </div>
                  ) : (
                    <span className="service-icon"><Icon size={21} strokeWidth={1.9} /></span>
                  )}
                  <h3>{t(titleKey)}</h3>
                  <p>{t(descKey)}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="section steps-section" id="how-it-works">
          <div className="container">
            <motion.div className="section-heading" variants={revealVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.35 }} transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}>
              <span className="eyebrow"><span className="eyebrow-dot" /> {t('howEyebrow')}</span>
              <h2>{t('howTitle')}</h2>
              <p>{t('howSubtitle')}</p>
            </motion.div>
            <motion.div className="steps-grid" variants={staggerVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
              {stepKeys.map(({ titleKey, descKey, icon: Icon }, index) => (
                <motion.article className="step-card" key={titleKey} variants={revealVariants} transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}>
                  <span className="step-number">0{index + 1}</span>
                  <span className="step-icon"><Icon size={28} strokeWidth={1.8} /></span>
                  <h3>{t(titleKey)}</h3>
                  <p>{t(descKey)}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="section" id="about">
          <motion.div className="container about-grid" variants={revealVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.25 }} transition={{ duration: reducedMotion ? 0 : 0.55, ease: 'easeOut' }}>
            <div className="about-visual" aria-hidden="true">
              <div className="about-campus-card">
                <div className="about-equipment-icons">
                  <Laptop size={42} />
                  <Network size={36} />
                  <Server size={38} />
                  <Projector size={34} />
                </div>
              </div>
              <span className="about-tag">{t('heroEyebrow')}</span>
            </div>
            <div className="about-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> {t('aboutEyebrow')}</span>
              <h2>{t('aboutTitle')}</h2>
              <p>{t('aboutDesc')}</p>
              <ul className="about-points">
                <li><Monitor size={17} /> {t('aboutPoint1')}</li>
                <li><CheckCircle2 size={17} /> {t('aboutPoint2')}</li>
                <li><ShieldCheck size={17} /> {t('aboutPoint3')}</li>
              </ul>
            </div>
          </motion.div>
        </section>

        <section className="cta-section">
          <div className="container">
            <motion.div className="cta-band" variants={revealVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.5 }} transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}>
              <div>
                <h2>{t('ctaTitle')}</h2>
                <p>{t('ctaDesc')}</p>
              </div>
              <MotionLink className="button button-light button-large" to="/login" whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
                {t('submitIctRequest')} <ArrowRight size={16} />
              </MotionLink>
            </motion.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default HomePage
