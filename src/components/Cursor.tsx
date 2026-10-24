import { useEffect, useRef } from 'react'
import { onProgress, onSection, scroll } from '../bot/store'
import { sfx } from '../bot/audio'

/* --------------------------- cursor --------------------------- */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let raf = 0
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      const t = (e.target as HTMLElement)?.closest?.('a, button, [data-hot]')
      ring.current?.classList.toggle('hot', !!t)
    }
    const loop = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div className="cursor-ring" ref={ring} />
      <div className="cursor-dot" ref={dot} />
    </>
  )
}

/* ------------------------- magnetic buttons ------------------- */
export function useMagnetic() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const els = Array.from(document.querySelectorAll<HTMLElement>('.btn, .sound-btn, .burger'))
    const offs: (() => void)[] = els.map((el) => {
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        el.style.transform = `translate(${dx * 0.26}px, ${dy * 0.32}px)`
      }
      const onLeave = () => {
        el.style.transform = ''
      }
      const onEnter = () => sfx.hover()
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      el.addEventListener('pointerenter', onEnter)
      return () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
        el.removeEventListener('pointerenter', onEnter)
      }
    })
    return () => offs.forEach((f) => f())
  }, [])
}

/* --------------------------- scroll rail ---------------------- */
const NAMES: Record<string, string> = {
  hero: 'MEET',
  character: 'CHARACTER',
  see: 'SEE',
  hear: 'HEAR',
  think: 'THINK',
  body: 'BODY',
  display: 'FACE',
  exploded: 'INSIDE',
  interact: 'TALK',
  personality: 'SOUL',
  space: 'SPACE',
  features: 'POSSIBLE',
  tech: 'CRAFT',
  final: 'READY',
  cta: 'ZERO BOT V1',
}

const ORDER = [
  'hero', 'character', 'see', 'hear', 'think', 'body', 'display', 'exploded',
  'interact', 'personality', 'space', 'features', 'tech', 'final', 'cta',
]

export function Rail() {
  const fill = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const p = onProgress((v) => {
      if (fill.current) fill.current.style.transform = `scaleY(${v.toFixed(4)})`
    })
    const s = onSection((id) => {
      if (label.current) label.current.textContent = NAMES[id] ?? id.toUpperCase()
      const i = ORDER.indexOf(id)
      if (count.current && i >= 0) {
        count.current.textContent = `${String(i + 1).padStart(2, '0')} / ${ORDER.length}`
      }
    })
    return () => {
      p()
      s()
    }
  }, [])

  return (
    <div className="rail" aria-hidden="true">
      <span className="idx" ref={label}>
        {NAMES[scroll.section] ?? 'MEET'}
      </span>
      <div className="track">
        <div className="fill" ref={fill} />
      </div>
      <span className="idx" ref={count}>
        01 / {ORDER.length}
      </span>
    </div>
  )
}
