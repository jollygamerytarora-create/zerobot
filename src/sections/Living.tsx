import { useLayoutEffect, useRef } from 'react'
import { gsap, onBoot, scrub } from './common'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* ====================== 9. INTERACTION ========================== */
const THREAD = [
  { who: 'user', text: '“What’s the weather like?”' },
  { who: 'bot', text: 'Looks like a good day to go outside.' },
  { who: 'user', text: '“Remind me to study at 7.”' },
  { who: 'bot', text: 'Consider it done.' },
  { who: 'user', text: '“What am I looking at?”' },
  { who: 'bot', text: 'Probably your next excuse to procrastinate.' },
]

export function Interact() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      onBoot(() => {
        gsap.from('.interact .scene-head > *', {
          y: 44,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.3,
        })
      })
      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.55), defaults: { ease: 'none' } })
      tl.fromTo('.thread', { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.1)
      THREAD.forEach((_, i) => {
        const at = 0.14 + i * 0.115
        tl.fromTo(
          `.thread .msg:nth-child(${i + 1})`,
          { opacity: 0, y: 30, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.07 },
          at,
        )
      })
      tl.to('.thread', { opacity: 0, y: -40, duration: 0.08 }, 0.92)
        .to('.interact .scene-head', { opacity: 0, y: -50, duration: 0.08 }, 0.92)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene interact" data-scene="interact" ref={ref}>
      <div className="pin">
        <div className="scene-head">
          <p className="eyebrow">09 — Conversation</p>
          <h2 className="grad-text">JUST TALK TO IT.</h2>
        </div>
        <div className="thread">
          {THREAD.map((m, i) => (
            <div className={`msg ${m.who}`} key={i}>
              <div className="who">{m.who === 'user' ? 'YOU' : 'ZERO BOT'}</div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ====================== 10. PERSONALITY ========================= */
export function Personality() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      const words = gsap.utils.toArray<HTMLElement>('.big-shout .w')
      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.6), defaults: { ease: 'none' } })
      words.forEach((w, i) => {
        tl.fromTo(
          w,
          { opacity: 0, y: 90, rotateX: -70 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.1 },
          0.04 + i * 0.055,
        )
      })
      tl.fromTo(
        '.blink-hint',
        { opacity: 0 },
        { opacity: 1, duration: 0.1 },
        0.5,
      )
      tl.to('.big-shout .w', { opacity: 0.12, y: -50, stagger: 0.015, duration: 0.14 }, 0.86)
      tl.to('.blink-hint', { opacity: 0, duration: 0.08 }, 0.86)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene personality" data-scene="personality" ref={ref}>
      <div className="pin">
        <div className="big-shout">
          <h2>
            <span className="w">IT&nbsp;HAS&nbsp;A</span>
            <br />
            <span className="w">PERSONALITY.</span>
          </h2>
        </div>
        <div className="blink-hint">MOVE YOUR CURSOR — IT IS WATCHING</div>
      </div>
    </section>
  )
}

/* ====================== 11. IN YOUR SPACE ======================= */
const SCENES = [
  {
    name: 'DESK',
    lamp: 'rgba(96,150,255,0.5)',
    lampPos: { left: '4%', top: '2%' },
    obj: { right: '6%', bottom: '30%', width: '30vw', height: '17vw' },
  },
  {
    name: 'BESIDE A LAPTOP',
    lamp: 'rgba(70,120,235,0.5)',
    lampPos: { right: '2%', top: '4%' },
    obj: { left: '5%', bottom: '30%', width: '26vw', height: '15vw' },
  },
  {
    name: 'BEDSIDE TABLE',
    lamp: 'rgba(255,190,130,0.38)',
    lampPos: { right: '8%', top: '6%' },
    obj: { right: '10%', bottom: '31%', width: '16vw', height: '9vw' },
  },
  {
    name: 'STUDY DESK',
    lamp: 'rgba(120,180,255,0.45)',
    lampPos: { left: '8%', top: '3%' },
    obj: { left: '7%', bottom: '30%', width: '20vw', height: '11vw' },
  },
  {
    name: 'GAMING SETUP',
    lamp: 'rgba(90,110,255,0.55)',
    lampPos: { left: '30%', top: '-6%' },
    obj: { right: '4%', bottom: '29%', width: '34vw', height: '19vw' },
  },
  {
    name: 'LIVING ROOM',
    lamp: 'rgba(160,170,255,0.4)',
    lampPos: { left: '46%', top: '-4%' },
    obj: { left: '4%', bottom: '28%', width: '40vw', height: '14vw' },
  },
]

export function Space() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current!
      const layers = gsap.utils.toArray<HTMLElement>('.room .layer')
      const names = gsap.utils.toArray<HTMLElement>('.space-scenes .s')

      const setIdx = (i: number) => {
        layers.forEach((l, k) => (l.style.opacity = k === i ? '1' : '0'))
        names.forEach((n, k) => n.classList.toggle('on', k === i))
      }
      setIdx(0)

      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const i = Math.min(SCENES.length - 1, Math.floor(self.progress * SCENES.length))
          setIdx(i)
        },
      })

      const tl = gsap.timeline({ scrollTrigger: scrub(el, 0, 1, 0.55), defaults: { ease: 'none' } })
      tl.fromTo('.space-copy', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.14 }, 0.03)
        .fromTo('.space-scenes', { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.12 }, 0.06)
        .to('.space-copy', { opacity: 0, y: -50, duration: 0.1 }, 0.88)
        .to('.space-scenes', { opacity: 0, duration: 0.08 }, 0.92)
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="scene space" data-scene="space" ref={ref}>
      <div className="room" aria-hidden="true">
        {SCENES.map((s, i) => (
          <div className="layer" key={s.name} style={{ opacity: i === 0 ? 1 : 0 }}>
            <div
              className="lamp"
              style={{
                background: `radial-gradient(circle, ${s.lamp}, rgba(0,0,0,0) 68%)`,
                ...s.lampPos,
              }}
            />
            <div className="surface" />
            <div className="obj" style={s.obj} />
          </div>
        ))}
      </div>

      <div className="pin">
        <div className="space-copy">
          <p className="eyebrow">11 — Everywhere you are</p>
          <h2 className="grad-text">MADE TO LIVE WITH YOU.</h2>
          <p className="copy" style={{ marginTop: '1.4rem', maxWidth: '40ch' }}>
            A tiny AI companion for your desk, your room, your work, your ideas and everything in
            between.
          </p>
        </div>

        <div className="space-scenes" aria-hidden="true">
          {SCENES.map((s) => (
            <span className="s" key={s.name}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
