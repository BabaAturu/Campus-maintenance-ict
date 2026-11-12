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

const services = [
  {
    title: 'Computer Hardware Maintenance',
    description: 'Get help with university desktop computers, laptops, components, and accessories.',
    icon: Laptop,
  },
  {
    title: 'Software & Operating System Support',
    description: 'Resolve operating system, application, installation, and software configuration issues.',
    icon: Monitor,
  },
  {
    title: 'Network & Internet Troubleshooting',
    description: 'Report wired or wireless network problems and internet connectivity issues.',
    icon: Network,
    image: '/network-switch.png',
  },
  {
    title: 'Printer & Scanner Maintenance',
    description: 'Request support for shared printers, scanners, drivers, and print connectivity.',
    icon: Printer,
    image: '/printer.png',
  },
  {
    title: 'Server & Storage Support',
    description: 'Get assistance with university servers, data storage, and related ICT systems.',
    icon: Server,
  },
  {
    title: 'ICT Classroom & Laboratory Equipment',
    description: 'Keep classroom and lab computers, projectors, and presentation equipment working.',
    icon: Projector,
  },
  {
    title: 'ICT Security & Other Technical Issues',
    description: 'Raise security concerns and other technical issues affecting university ICT resources.',
    icon: ShieldCheck,
  },
]

const steps = [
  {
    title: 'Submit an ICT Request',
    description: 'Describe the computer, network, or ICT equipment issue and where it is on campus.',
    icon: ClipboardList,
  },
  {
    title: 'Track Your Request',
    description: 'Follow request progress and stay informed as the ICT support team responds.',
    icon: Network,
  },
  {
    title: 'Get Back to Work',
    description: 'The university ICT team works to resolve the issue and restore your equipment.',
    icon: CheckCircle2,
  },
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
          {show3D ? 'Show image views' : 'View 3D model'}
        </button>
      </div>
      <div className="request-card">
        <div className="request-card-top">
          <span>CAMPUS ICT SUPPORT</span>
          <span className="request-card-icon"><Monitor size={15} /></span>
        </div>
        <h3>Computer &amp; network help</h3>
        <p>Arba Minch University</p>
        <div className="request-card-status">
          <span>Main Campus</span>
          <span className="status-pill">CampusCare</span>
        </div>
      </div>
      <div className="floating-note">
        <span className="floating-note-icon"><Check size={16} /></span>
        <span><strong>ICT support</strong><small>Teaching · learning · research</small></span>
      </div>
    </div>
  )
}

function HomePage() {
  const reducedMotion = useReducedMotion()

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
              <span className="eyebrow"><span className="eyebrow-dot" /> Arba Minch University · Main Campus</span>
              <h1>Campus ICT Maintenance Request System</h1>
              <p>
                Report, track, and manage computer hardware, software, network, and ICT equipment maintenance requests across the university campus.
              </p>
              <div className="hero-actions">
                <MotionLink className="button button-primary button-large" to="/login" whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
                  Submit ICT Request <ArrowRight size={16} />
                </MotionLink>
                <MotionLink className="button button-outline button-large" to="/register" whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
                  Register
                </MotionLink>
              </div>
              <div className="hero-proof">
                <span className="hero-proof-icon"><ShieldCheck size={17} /></span>
                <span>Dedicated ICT support for the AMU Main Campus community</span>
              </div>
            </motion.div>
            <IctIllustration reducedMotion={reducedMotion} />
          </div>
        </section>

        <section className="section" id="services">
          <div className="container">
            <motion.div className="section-heading" variants={revealVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.35 }} transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}>
              <span className="eyebrow"><span className="eyebrow-dot" /> University ICT support</span>
              <h2>ICT services we support</h2>
              <p>Choose the area that best describes your computer, network, or technical issue.</p>
            </motion.div>
            <motion.div className="service-grid" variants={staggerVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.14 }}>
              {services.map(({ title, description, icon: Icon, image }) => (
                <motion.article
                  className="service-card"
                  key={title}
                  variants={revealVariants}
                  transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
                  whileHover={reducedMotion ? undefined : { y: -7, rotateX: -2, rotateY: 1.5, scale: 1.015 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.99 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {image ? (
                    <div className={`service-image service-image-${title.startsWith('Network') ? 'network' : 'printer'}`}>
                      <img src={image} alt="" loading="lazy" decoding="async" />
                    </div>
                  ) : (
                    <span className="service-icon"><Icon size={21} strokeWidth={1.9} /></span>
                  )}
                  <h3>{title}</h3>
                  <p>{description}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="section steps-section" id="how-it-works">
          <div className="container">
            <motion.div className="section-heading" variants={revealVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.35 }} transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}>
              <span className="eyebrow"><span className="eyebrow-dot" /> Simple ICT support</span>
              <h2>How it works</h2>
              <p>Get your ICT issue to the right support team in a few simple steps.</p>
            </motion.div>
            <motion.div className="steps-grid" variants={staggerVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
              {steps.map(({ title, description, icon: Icon }, index) => (
                <motion.article className="step-card" key={title} variants={revealVariants} transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}>
                  <span className="step-number">0{index + 1}</span>
                  <span className="step-icon"><Icon size={28} strokeWidth={1.8} /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
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
              <span className="about-tag">Arba Minch University · Main Campus</span>
            </div>
            <div className="about-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> About the ICT request system</span>
              <h2>Technology support for teaching, learning, and research</h2>
              <p>
                The Campus ICT Maintenance Request System connects Arba Minch University Main Campus students and staff with ICT support for computers, software, networks, and technical equipment.
              </p>
              <ul className="about-points">
                <li><Monitor size={17} /> Support for university computers and ICT equipment</li>
                <li><CheckCircle2 size={17} /> Clear updates as your request is handled</li>
                <li><ShieldCheck size={17} /> A dedicated channel for ICT security concerns</li>
              </ul>
            </div>
          </motion.div>
        </section>

        <section className="cta-section">
          <div className="container">
            <motion.div className="cta-band" variants={revealVariants} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.5 }} transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}>
              <div>
                <h2>Need ICT support on campus?</h2>
                <p>Submit a request for computer, software, network, or other ICT equipment maintenance.</p>
              </div>
              <MotionLink className="button button-light button-large" to="/login" whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
                Submit ICT Request <ArrowRight size={16} />
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
