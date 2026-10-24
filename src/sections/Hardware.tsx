import { useLayoutEffect, useRef } from 'react'
import { gsap, onBoot, scrub } from './common'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PartLabels from '../components/PartLabels'

/* ====================== 6. THE BODY (360°) ======================= */
export function Body() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      onBoot(() => {
        gsap.from('.hardware .scene-head > *', {
          y: 46,
          opacity: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.3,
        })
      })
      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.6), defaults: { ease: 'none' } })
      tl.fromTo('.hardware .scene-head', { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.02)
        .fromTo(
          '.hardware-note',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.1 },
          0.06,
        )
        .to('.hardware .scene-head, .hardware-note', { opacity: 0, y: -40, duration: 0.1 }, 0.9)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene hardware" data-scene="body" ref={ref}>
      <div className="pin">
        <div className="scene-head center">
          <p className="eyebrow">06 — Industrial design</p>
          <h2 className="grad-text">SMALL BY DESIGN.</h2>
          <p className="lead" style={{ margin: '1.1rem auto 0', textAlign: 'center' }}>
            BIG ON POSSIBILITY.
          </p>
        </div>
        <div className="hardware-note">KEEP SCROLLING — FULL 360°</div>
        <PartLabels section="body" />
      </div>
    </section>
  )
}

/* ======================= 7. THE DISPLAY ========================= */
const EXPRS = ['HAPPY', 'WIDE', 'SURPRISE', 'WINK', 'SLEEP', 'COOL']

export function Display() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!

      const chips = gsap.utils.toArray<HTMLElement>('.expr-strip .e')
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const p = self.progress
          let idx = -1
          if (p > 0.3 && p <= 0.72) idx = Math.min(5, Math.floor(((p - 0.3) / 0.42) * 6))
          chips.forEach((c, i) => c.classList.toggle('on', i === idx))
        },
      })

      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.6), defaults: { ease: 'none' } })
      tl.fromTo(
        '.display .scene-head',
        { opacity: 0, y: -40 },
        { opacity: 1, y: 0, duration: 0.12 },
        0.04,
      )
        .fromTo('.expr-strip', { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.1 }, 0.16)
        .fromTo(
          '.display-note',
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.12 },
          0.72,
        )
        .to('.expr-strip', { opacity: 0, y: -24, duration: 0.1 }, 0.7)
        .to('.display .scene-head', { opacity: 0, y: -40, duration: 0.1 }, 0.86)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene display" data-scene="display" ref={ref}>
      <div className="pin">
        <div className="scene-head center">
          <p className="eyebrow">07 — Expression engine</p>
          <h2 className="grad-text">A FACE THAT SPEAKS.</h2>
        </div>
        <div className="expr-strip" aria-hidden="true">
          {EXPRS.map((e) => (
            <span className="e" key={e}>
              {e}
            </span>
          ))}
        </div>
        <div className="display-note">Every conversation starts with an expression.</div>
      </div>
    </section>
  )
}

/* ==================== 8. EXPLODED REVEAL ======================== */
export function Exploded() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.55), defaults: { ease: 'none' } })
      tl.fromTo(
        '.exploded .scene-head',
        { opacity: 0, y: -40 },
        { opacity: 1, y: 0, duration: 0.1 },
        0.03,
      )
        .fromTo('.explode-note', { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.1)
        .to('.explode-note', { opacity: 0.35, duration: 0.1 }, 0.66)
        .to('.exploded .scene-head', { opacity: 0, y: -40, duration: 0.1 }, 0.92)
        .to('.explode-note', { opacity: 0, duration: 0.06 }, 0.95)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene exploded" data-scene="exploded" ref={ref}>
      <div className="pin">
        <div className="scene-head center">
          <p className="eyebrow">08 — Engineering</p>
          <h2 className="grad-text">EVERY LAYER, CONSIDERED.</h2>
        </div>
        <div className="explode-note">SCROLL TO SEPARATE — THEN ASSEMBLE</div>
        <PartLabels section="exploded" />
      </div>
    </section>
  )
}
