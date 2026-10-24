import { useLayoutEffect, useRef } from 'react'
import { gsap, onBoot, scrub } from './common'

/* ============================== SEE ============================== */
const TARGETS = [
  { label: 'PERSON', style: { right: '5%', top: '27%', width: '150px', height: '230px' } },
  { label: 'LAPTOP', style: { right: '27%', top: '56%', width: '215px', height: '132px' } },
  { label: 'PHONE', style: { right: '4%', top: '66%', width: '94px', height: '164px' } },
  { label: 'OBJECT', style: { right: '13%', top: '12%', width: '126px', height: '104px' } },
  { label: 'ENVIRONMENT', style: { right: '31%', top: '16%', width: '244px', height: '92px' } },
]

export function See() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      onBoot(() => {
        gsap.from('.see-copy > *', {
          y: 44,
          opacity: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.3,
        })
      })

      const tl = gsap.timeline({
        scrollTrigger: scrub(el, 0, 1, 0.65),
        defaults: { ease: 'none' },
      })
      tl.fromTo('.hud .grid', { opacity: 0 }, { opacity: 1, duration: 0.16 }, 0.06)
        .fromTo(
          '.hud .depth',
          { opacity: 0, scale: 0.72 },
          { opacity: 1, scale: 1, duration: 0.24 },
          0.06,
        )
        .fromTo('.hud .reticle', { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.12 }, 0.14)
        .fromTo(
          '.see-copy',
          { opacity: 0, x: 70 },
          { opacity: 1, x: 0, duration: 0.14 },
          0,
        )

      TARGETS.forEach((_, i) => {
        const at = 0.24 + i * 0.11
        tl.fromTo(
          `.hud .box.b${i}`,
          { opacity: 0, scale: 0.9, y: 16 },
          { opacity: 1, scale: 1, y: 0, duration: 0.09 },
          at,
        )
        if (i < 3) {
          tl.to(`.hud .box.b${i}`, { opacity: 0, duration: 0.08 }, 0.72 + i * 0.03)
        }
      })
      tl.to('.hud .depth, .hud .reticle, .hud .grid', { opacity: 0, duration: 0.14 }, 0.84)
      tl.to('.hud .box', { opacity: 0, duration: 0.1 }, 0.84)
      tl.to('.see-copy', { opacity: 0, y: -50, duration: 0.1 }, 0.92)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene see" data-scene="see" ref={ref}>
      <div className="pin">
        <div className="hud" aria-hidden="true">
          <div className="grid" />
          <div className="depth" style={{ left: '34%' }} />
          <div className="reticle" style={{ left: '34%', top: '54%' }} />
          {TARGETS.map((t, i) => (
            <div className={`box b${i}`} key={t.label} style={t.style}>
              <span className="tag">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="see-copy">
          <p className="eyebrow">03 — Vision</p>
          <h2 className="grad-text">IT SEES.</h2>
          <p className="lead" style={{ marginTop: '1.4rem' }}>
            Understand the world around you.
          </p>
          <p className="copy" style={{ marginTop: '1rem' }}>
            Zero Bot can use vision to understand what is happening around it and respond to what it
            sees.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ============================== HEAR ============================= */
export function Hear() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!

      // continuous, organic waveform
      gsap.to('.wave i', {
        height: () => `${18 + Math.random() * 82}%`,
        duration: () => 0.3 + Math.random() * 0.55,
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        ease: 'sine.inOut',
        stagger: { each: 0.028, from: 'center' },
      })

      const steps = gsap.utils.toArray<HTMLElement>('.status .step')
      ScrollTriggerCreate(el, (p) => {
        const idx = p < 0.24 ? -1 : p < 0.48 ? 0 : p < 0.7 ? 1 : p < 0.9 ? 2 : -1
        steps.forEach((s, i) => s.classList.toggle('on', i === idx))
      })

      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.6), defaults: { ease: 'none' } })
      tl.fromTo('.hear .scene-head', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.14 }, 0)
        .fromTo('.hey', { opacity: 0, x: -50, scale: 0.9 }, { opacity: 1, x: 0, scale: 1, duration: 0.1 }, 0.1)
        .fromTo('.mic-ring', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.2 }, 0.12)
        .fromTo('.wave', { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.16 }, 0.18)
        .fromTo('.status', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.12 }, 0.22)
        .to('.hey', { opacity: 0, y: -30, duration: 0.1 }, 0.48)
        .to('.wave', { scaleY: 0.45, opacity: 0.55, duration: 0.2 }, 0.72)
        .to('.hear .scene-head, .status, .mic-ring', { opacity: 0, y: -40, duration: 0.12 }, 0.9)
    }, ref)
    return () => ctx.revert()
  }, [])

  const bars = Array.from({ length: 52 })

  return (
    <section className="scene hear" data-scene="hear" ref={ref}>
      <div className="pin">
        <div className="scene-head center">
          <p className="eyebrow">04 — Voice</p>
          <h2 className="grad-text">IT LISTENS.</h2>
        </div>

        <div className="mic-ring" aria-hidden="true" />

        <div className="hey">
          <span className="pill">“Hey Zero.”</span>
        </div>

        <div className="status" aria-hidden="true">
          <span className="step">LISTENING...</span>
          <span className="step">THINKING...</span>
          <span className="step">RESPONDING...</span>
        </div>

        <div className="wave" aria-hidden="true">
          {bars.map((_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================== THINK ============================ */
export function Think() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      onBoot(() => {
        gsap.from('.think .scene-head > *', {
          y: 44,
          opacity: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.3,
        })
      })
      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.6), defaults: { ease: 'none' } })
      tl.fromTo('.think-copy', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.16 }, 0.12)
        .to('.think-copy', { opacity: 0, y: -50, duration: 0.12 }, 0.56)
        .to('.think .scene-head', { opacity: 0, y: -70, duration: 0.12 }, 0.5)
        .fromTo(
          '.think-final',
          { opacity: 0, y: 70, filter: 'blur(14px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.18 },
          0.74,
        )
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene think" data-scene="think" ref={ref}>
      <div className="pin">
        <div className="scene-head">
          <p className="eyebrow">05 — Intelligence</p>
          <h2 className="grad-text">IT THINKS.</h2>
        </div>

        <div className="think-copy">
          <p className="lead">
            Powered by intelligence designed to understand context, conversation and intent.
          </p>
        </div>

        <div className="think-final grad-text">
          COMPLEX INTELLIGENCE.
          <br />
          SIMPLE INTERACTION.
        </div>
      </div>
    </section>
  )
}

/* ------------------------- small helper -------------------------- */
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function ScrollTriggerCreate(el: HTMLElement, onUpdate: (p: number) => void) {
  return ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => onUpdate(self.progress),
  })
}
