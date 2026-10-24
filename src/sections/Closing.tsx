import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import { gsap, onBoot, scrub } from './common'
import { scrollTo } from '../bot/scroll'
import { sfx } from '../bot/audio'
import { getProfile, onProfileChange, waLink, type Profile } from '../bot/profile'

/* ======================= 12. FEATURE WALL ======================= */
const FEATURES = [
  { n: '01', t: 'VOICE', d: 'Talk naturally.' },
  { n: '02', t: 'VISION', d: 'Understand what it sees.' },
  { n: '03', t: 'EXPRESSIONS', d: 'React visually.' },
  { n: '04', t: 'AI', d: 'Think, reason and respond.' },
  { n: '05', t: 'AUDIO', d: 'Hear and speak naturally.' },
  { n: '06', t: 'AUTOMATION', d: 'Interact with your digital world.' },
]

export function Features() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.55), defaults: { ease: 'none' } })
      tl.fromTo('.features .scene-head', { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.1 }, 0.02)
      FEATURES.forEach((_, i) => {
        const at = 0.1 + i * 0.13
        tl.fromTo(
          `.feat.f${i + 1}`,
          { opacity: 0, y: 54, filter: 'blur(10px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.08 },
          at,
        )
        if (i < FEATURES.length - 1) {
          tl.to(`.feat.f${i + 1}`, { opacity: 0, y: -40, duration: 0.07 }, at + 0.12)
        }
      })
      tl.to('.features .scene-head', { opacity: 0, duration: 0.06 }, 0.94)
      tl.to('.feat.f6', { opacity: 0, y: -40, duration: 0.06 }, 0.94)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene features" data-scene="features" ref={ref}>
      <div className="pin">
        <div className="scene-head center">
          <p className="eyebrow">12 — Capability</p>
          <h2 className="grad-text">WHAT ZERO BOT CAN DO</h2>
        </div>
        {FEATURES.map((f, i) => (
          <div className={`feat f${i + 1}`} key={f.t}>
            <span className="n">{f.n}</span>
            <div className="t">{f.t}</div>
            <div className="d">{f.d}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ====================== 13. TECHNICAL BEAUTY ==================== */
const SPECS = [
  ['DISPLAY', 'Curved expressive display'],
  ['AUDIO', 'Integrated speaker system'],
  ['CONNECTIVITY', 'Wireless connectivity'],
  ['POWER', 'USB-C'],
  ['PROCESSING', 'AI-powered computing'],
]

export function Tech() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.55), defaults: { ease: 'none' } })
      tl.fromTo('.tech-copy > *', { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.16, stagger: 0.03 }, 0.06)
      SPECS.forEach((_, i) => {
        tl.fromTo(
          `.spec:nth-child(${i + 1})`,
          { opacity: 0, x: 70 },
          { opacity: 1, x: 0, duration: 0.09 },
          0.16 + i * 0.11,
        )
      })
      tl.to('.tech-copy, .specs', { opacity: 0, y: -44, duration: 0.1 }, 0.9)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene tech" data-scene="tech" ref={ref}>
      <div className="pin">
        <div className="tech-copy">
          <p className="eyebrow">13 — Craft</p>
          <h2 className="grad-text" style={{ fontSize: 'clamp(1.9rem, 4vw, 3.6rem)' }}>
            BUILT LIKE A DEVICE.
            <br />
            DESIGNED LIKE A CHARACTER.
          </h2>
        </div>
        <div className="specs">
          {SPECS.map(([k, v]) => (
            <div className="spec" key={k}>
              <span className="k">{k}</span>
              <span className="v">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =================== 14. FINAL TRANSFORMATION =================== */
export function Final() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.5), defaults: { ease: 'none' } })
      tl.fromTo('.final .scene-head', { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.1 }, 0.02)
        .to('.final .scene-head', { opacity: 0, y: -30, duration: 0.08 }, 0.3)
        .fromTo('.blackout', { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.68)
        .fromTo(
          '.final-line .ready',
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.05 },
          0.73,
        )
        .to('.final-line .ready', { opacity: 0, duration: 0.04 }, 0.82)
        .to('.blackout', { opacity: 0, duration: 0.06 }, 0.86)
        .fromTo(
          '.final-line .meet',
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.05 },
          0.89,
        )
        .to('.final-line .meet', { opacity: 0, y: -30, duration: 0.04 }, 0.97)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene final" data-scene="final" ref={ref}>
      <div className="pin">
        <div className="scene-head center">
          <p className="eyebrow">14 — The reveal</p>
        </div>
        <div className="blackout" />
        <div className="final-line">
          <span className="ready grad-text">READY?</span>
          <span className="meet grad-text">MEET ZERO BOT V1.</span>
        </div>
      </div>
    </section>
  )
}

/* The escape artist: never lets itself be clicked.
   Desktop — flees on hover. Touch — flees on press, before a click can land. */
const flee = (el: HTMLElement) => {
  const row = el.closest('.cta-row')
  const rr = row ? row.getBoundingClientRect() : null
  const r = el.getBoundingClientRect()
  const minX = 16
  const maxX = Math.max(minX, innerWidth - r.width - 16)
  const minY = 74
  // stay above the CTA row so it can never cover the real buttons
  const maxY = Math.max(minY, (rr ? rr.top : innerHeight * 0.6) - r.height - 36)
  const tx = minX + Math.random() * (maxX - minX)
  const ty = minY + Math.random() * (maxY - minY)
  const fx = Number(el.dataset.fx || 0)
  const fy = Number(el.dataset.fy || 0)
  const nx = fx + (tx - r.left)
  const ny = fy + (ty - r.top)
  el.dataset.fx = String(nx)
  el.dataset.fy = String(ny)
  sfx.click()
  gsap.to(el, {
    x: nx,
    y: ny,
    rotation: gsap.utils.random(-14, 14),
    duration: 0.5,
    ease: 'power3.out',
    overwrite: true,
  })
}

/* =========================== FINAL CTA ========================== */
export function Cta() {
  const [prof, setProf] = useState<Profile | null>(getProfile())

  useEffect(() => onProfileChange(setProf), [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cta h2, .cta .product-name, .cta .cta-row .btn, .cta .credit', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.cta', start: 'top 65%' },
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      <section className="cta" data-scene="cta">
        <h2 className="grad-text">YOUR NEXT COMPANION IS HERE.</h2>
        <p className="product-name">ZERO BOT V1</p>
        <div className="cta-row">
          <a
            className="btn btn-primary"
            href={waLink(prof)}
            target="_blank"
            rel="noopener noreferrer"
            data-hot
            onClick={() => sfx.click()}
          >
            <span className="dot" />
            Pre-register now
          </a>
          <a
            className="btn btn-ghost"
            href="#tech"
            data-hot
            onClick={(e) => {
              e.preventDefault()
              sfx.click()
              scrollTo('[data-scene="tech"]')
            }}
          >
            Explore the technology
          </a>
          <button
            type="button"
            className="btn btn-ghost btn-run"
            aria-label="I don't want zero"
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') flee(e.currentTarget)
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              flee(e.currentTarget)
            }}
            onClick={(e) => e.preventDefault()}
          >
            I don't want zero
          </button>
        </div>
        <p className="credit">
          <strong>ZERO BOT V1</strong>
          <br />
          Designed by JollyTech
        </p>
      </section>

      <footer className="footer">
        <div className="fl">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
          <a href="#instagram">Instagram</a>
          <a href="#youtube">YouTube</a>
          <a href="#github">GitHub</a>
        </div>
        <div className="fc">© 2026 JOLLYTECH — ZERO BOT V1</div>
      </footer>
    </>
  )
}
