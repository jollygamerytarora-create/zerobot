import { useLayoutEffect, useRef } from 'react'
import { gsap, onBoot, scrub } from './common'

export default function Character() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      onBoot(() => {
        gsap.from('.character .scene-head > *', {
          y: 46,
          opacity: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.25,
        })
        gsap.from('.orbit-tag', {
          opacity: 0,
          scale: 0.8,
          duration: 0.9,
          stagger: 0.14,
          ease: 'power2.out',
          delay: 0.7,
        })
      })

      gsap.to('.character .scene-head', {
        opacity: 0,
        y: -60,
        ease: 'none',
        scrollTrigger: scrub(el, 0.5, 0.64, 0.5),
      })
      gsap.to('.orbit-tag', {
        opacity: 0,
        scale: 0.86,
        stagger: 0.06,
        ease: 'none',
        scrollTrigger: scrub(el, 0.52, 0.66, 0.5),
      })
      gsap.fromTo(
        '.char-copy',
        { opacity: 0, x: -70 },
        {
          opacity: 1,
          x: 0,
          ease: 'none',
          scrollTrigger: scrub(el, 0.64, 0.78, 0.6),
        },
      )
      gsap.fromTo(
        '.char-copy .lines em',
        { opacity: 0.35 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: scrub(el, 0.78, 0.94, 0.6),
        },
      )
      gsap.to('.char-copy', {
        opacity: 0,
        y: -50,
        ease: 'none',
        scrollTrigger: scrub(el, 0.95, 1, 0.4),
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene character" data-scene="character" ref={ref}>
      <div className="pin">
        <div className="scene-head center">
          <p className="eyebrow">02 — The character</p>
          <h2 className="grad-text">
            NOT JUST SMART.
            <br />
            ALIVE.
          </h2>
        </div>

        <span className="orbit-tag t1">EXPRESSIVE</span>
        <span className="orbit-tag t2">RESPONSIVE</span>
        <span className="orbit-tag t3">ALWAYS THERE</span>

        <div className="char-copy">
          <p className="eyebrow">AI with a face.</p>
          <p className="lines">
            Zero Bot doesn't just answer.
            <br />
            It reacts.
            <br />
            It listens.
            <br />
            It thinks.
            <br />
            And sometimes...
            <br />
            <em>it has a personality.</em>
          </p>
        </div>
      </div>
    </section>
  )
}
