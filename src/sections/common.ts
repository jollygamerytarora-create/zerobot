import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { appState } from '../bot/store'

gsap.registerPlugin(ScrollTrigger)

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).gsap = gsap
  ;(window as unknown as Record<string, unknown>).ScrollTrigger = ScrollTrigger
}

export { gsap, ScrollTrigger }

/** Run once the loading sequence has finished revealing the page. */
export function onBoot(cb: () => void) {
  if (appState.booted) {
    cb()
    return () => {}
  }
  const h = () => cb()
  window.addEventListener('zero:boot', h, { once: true })
  return () => window.removeEventListener('zero:boot', h)
}

/** Standard scrub range helper for tall pinned sections. */
export function scrub(trigger: HTMLElement, startPct: number, endPct: number, scrub = 0.7) {
  const h = trigger.offsetHeight - window.innerHeight
  return {
    trigger,
    start: `top+=${(h * startPct).toFixed(0)} top`,
    end: `top+=${(h * endPct).toFixed(0)} top`,
    scrub,
  }
}
