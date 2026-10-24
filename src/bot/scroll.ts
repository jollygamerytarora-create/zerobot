import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { applyChoreo } from './choreo'
import { emitProgress, quality, scroll } from './store'
import { loop, makeStallWatch } from './raf'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let scenes: HTMLElement[] = []
let lastSection = ''
let lastP = -1
let stop: (() => void) | null = null

export function initScroll() {
  if (!quality.reduced) {
    lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
    })
    lenis.on('scroll', (e: { velocity?: number }) => {
      scroll.velocity = e.velocity ?? 0
    })
  }

  scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__lenis = lenis
  }

  const stall = makeStallWatch(280)
  let gsapBroken = false

  stop = loop(() => {
    // smooth scrolling
    if (lenis) lenis.raf(performance.now())
    // GSAP is normally driven by its own rAF ticker; nudge it if that stalls,
    // otherwise scrubbed content and intro tweens would freeze with the window.
    if (!gsapBroken) {
      const g = gsap as unknown as { ticker?: { frame?: number; tick?: (t: number) => void } }
      if (g.ticker && typeof g.ticker.tick === 'function') {
        if (typeof g.ticker.frame === 'number' && !stallSteady(g.ticker.frame)) stall.mark()
        if (stall.stalled()) {
          try {
            g.ticker.tick(performance.now())
          } catch {
            gsapBroken = true
          }
        }
      }
    }
    ScrollTrigger.update()
    updateScene()
  })

  updateScene()

  const refresh = () => {
    scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
    ScrollTrigger.refresh()
    updateScene()
  }
  window.addEventListener('resize', refresh)
  window.addEventListener('load', refresh)
  return () => stop?.()
}

let steadyLast = -1
function stallSteady(frame: number) {
  const changed = frame !== steadyLast
  steadyLast = frame
  return changed
}

function updateScene() {
  if (!scenes.length) return
  const vh = window.innerHeight

  let best = scenes[0]
  let bestVis = -1
  for (const el of scenes) {
    const r = el.getBoundingClientRect()
    const vis = Math.min(r.bottom, vh) - Math.max(r.top, 0)
    if (vis > bestVis) {
      bestVis = vis
      best = el
    }
  }

  const r = best.getBoundingClientRect()
  const id = best.dataset.scene!
  const span = r.height - vh
  let p: number
  if (span > vh * 0.5) {
    p = span > 0 ? -r.top / span : 0
  } else {
    p = (vh - r.top) / (vh + r.height)
  }
  p = p < 0 ? 0 : p > 1 ? 1 : p

  const changed = id !== lastSection || Math.abs(p - lastP) > 0.0004
  if (!changed) return
  lastSection = id
  lastP = p
  applyChoreo(id, p)

  const doc = document.documentElement
  const max = doc.scrollHeight - vh
  emitProgress(max > 0 ? window.scrollY / max : 0)
}

export function scrollTo(target: string) {
  const el = document.querySelector(target)
  if (!el) return
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.6 })
  else (el as HTMLElement).scrollIntoView({ behavior: 'smooth' })
}

export function getLenis() {
  return lenis
}
