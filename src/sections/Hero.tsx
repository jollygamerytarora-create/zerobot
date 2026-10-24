import { useLayoutEffect, useRef } from 'react'
import { gsap, onBoot, scrub } from './common'
import { scrollTo } from '../bot/scroll'
import { sfx } from '../bot/audio'

export default function Hero() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      onBoot(() => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('.hero-title h1', { y: 70, opacity: 0, duration: 1.5 })
          .from('.hero-sub', { y: 34, opacity: 0, duration: 1 }, '-=1.15')
          .from('.hero-copy', { y: 26, opacity: 0, duration: 0.9 }, '-=0.85')
          .from('.hero-cta .btn', { y: 26, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.7')
          .from('.scroll-hint', { opacity: 0, duration: 0.9 }, '-=0.5')
      })
      // nav lives outside the hero, so animate it unscoped
      onBoot(() => {
        gsap.from('.nav', { y: -40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.15 })
      })

      if (!ref.current) return
      const el = ref.current

      gsap.to('.hero-title h1', {
        opacity: 0,
        y: -110,
        filter: 'blur(9px)',
        ease: 'none',
        scrollTrigger: scrub(el, 0, 0.34, 0.5),
      })
      gsap.to('.hero-rest', {
        opacity: 0,
        y: 70,
        ease: 'none',
        scrollTrigger: scrub(el, 0, 0.3, 0.5),
      })
      gsap.to('.scroll-hint', {
        opacity: 0,
        scrollTrigger: scrub(el, 0, 0.12, 0.4),
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene hero" data-scene="hero" ref={ref} id="top">
      <div className="pin hero-title">
        <h1 className="grad-text">MEET ZERO BOT V1.</h1>
      </div>

      <div className="pin hero-rest">
        <div className="hero-bottom">
          <div>
            <p className="hero-sub">
              A little AI.
              <br />A lot of personality.
            </p>
            <p className="hero-copy">
              Your intelligent companion, designed to see, hear, think and interact.
            </p>
          </div>
          <div className="hero-cta">
            <div className="cta-row">
              <a
                className="btn btn-primary"
                href="#character"
                data-hot
                onClick={(e) => {
                  e.preventDefault()
                  sfx.click()
                  scrollTo('[data-scene="character"]')
                }}
              >
                <span className="dot" />
                Explore Zero Bot
              </a>
              <a
                className="btn btn-ghost"
                href="#think"
                data-hot
                onClick={(e) => {
                  e.preventDefault()
                  sfx.click()
                  scrollTo('[data-scene="hear"]')
                }}
              >
                Watch the experience
              </a>
            </div>
          </div>
        </div>

        <div className="scroll-hint">
          SCROLL
          <i />
        </div>
      </div>
    </section>
  )
}
