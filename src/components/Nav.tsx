import { useEffect, useState } from 'react'
import { onSection } from '../bot/store'
import { scrollTo } from '../bot/scroll'
import { initSound, isSoundOn, setSound, sfx } from '../bot/audio'
import { openSettings } from '../bot/profile'

const MAP: Record<string, string> = {}
const GROUPS: Record<string, string[]> = {
  product: ['hero', 'character', 'body', 'display', 'exploded'],
  technology: ['see', 'hear', 'think', 'features', 'tech'],
  experience: ['interact', 'personality', 'space', 'final', 'cta'],
}
for (const [g, list] of Object.entries(GROUPS)) for (const s of list) MAP[s] = g

const TARGET: Record<string, string> = {
  product: '[data-scene="hero"]',
  technology: '[data-scene="see"]',
  experience: '[data-scene="interact"]',
}

export default function Nav() {
  const [active, setActive] = useState('product')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [sound, setS] = useState(false)

  useEffect(() => {
    setS(initSound())
    const off = onSection((id) => {
      const g = MAP[id]
      if (g) setActive(g)
    })
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      off()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const go = (sel: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    sfx.click()
    scrollTo(sel)
  }

  const toggleSound = () => {
    const next = !sound
    setS(next)
    setSound(next)
    if (next) sfx.click()
  }

  return (
    <>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <a className="brand" href="#top" onClick={go('#top')}>
          <span className="brand-mark">ZERO</span>
          <span className="brand-sub">BOT V1</span>
        </a>

        <nav className="nav-links">
          {Object.keys(GROUPS).map((g) => (
            <a
              key={g}
              href={`#${g}`}
              className={active === g ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault()
                sfx.click()
                scrollTo(TARGET[g])
              }}
              data-hot
            >
              {g}
            </a>
          ))}
        </nav>

        <div className="nav-right">
          <button
            className="sound-btn set-btn"
            onClick={() => {
              sfx.click()
              openSettings()
            }}
            aria-label="Settings"
            title="Change settings"
            data-hot
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            className={`sound-btn ${sound ? 'on' : ''}`}
            onClick={toggleSound}
            aria-label={sound ? 'Mute sound' : 'Enable sound'}
            title={sound ? 'Sound on' : 'Sound off'}
            data-hot
          >
            <span className="bars">
              <i />
              <i />
              <i />
            </span>
          </button>
          <a
            className="btn btn-primary nav-cta"
            href="#cta"
            onClick={(e) => {
              e.preventDefault()
              sfx.click()
              scrollTo('[data-scene="cta"]')
            }}
            data-hot
          >
            Get Zero Bot
          </a>
          <button
            className="burger"
            onClick={() => {
              setOpen((o) => !o)
              sfx.click()
            }}
            aria-label="Menu"
          >
            <span style={open ? { transform: 'translateY(5px) rotate(45deg)' } : undefined} />
            <span style={open ? { opacity: 0 } : undefined} />
            <span style={open ? { transform: 'translateY(-5px) rotate(-45deg)' } : undefined} />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${open ? 'open' : ''}`}>
        {Object.keys(GROUPS).map((g) => (
          <a key={g} href={`#${g}`} onClick={go(TARGET[g])}>
            {g}
          </a>
        ))}
        <a
          href="#cta"
          onClick={go('[data-scene="cta"]')}
          style={{ color: '#8cc2ff', borderBottom: 'none' }}
        >
          Get Zero Bot
        </a>
        <div className="mm-foot">ZERO BOT V1 — DESIGNED BY JOLLYTECH</div>
      </div>
    </>
  )
}
