/**
 * Shared, mutable scroll/bot state.
 * `T` is the desired state written by the scroll choreography,
 * `C` is the smoothed current state lerped toward `T` every frame.
 * Damping is what gives the product its sense of weight and inertia.
 */

export type Expr =
  | 'calm'
  | 'curious'
  | 'happy'
  | 'surprised'
  | 'thinking'
  | 'sleepy'
  | 'excited'
  | 'confused'
  | 'wink'
  | 'cool'
  | 'listening'
  | 'talking'
  | 'wow'

export interface BotState {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  scale: number
  rim: number
  screen: number
  explode: number
  glow: number
  particles: number
  flow: number
  camZ: number
  /** global light dimmer (0 = everything goes black) */
  dim: number
}

const base: BotState = {
  x: 0,
  y: -0.05,
  z: 0,
  rx: 0,
  ry: 0,
  rz: 0,
  scale: 1,
  rim: 0.5,
  screen: 1,
  explode: 0,
  glow: 0.55,
  particles: 0.3,
  flow: 0.15,
  camZ: 7.6,
  dim: 1,
}

export const T: BotState = { ...base }
export const C: BotState = { ...base }

/** Expression targets (smoothly morphed inside the face renderer). */
export const faceState = {
  expr: 'calm' as Expr,
  /** idle auto-blink is always allowed */
  blink: true,
  /** extra eye look bias coming from choreography (-1..1) */
  lookX: 0,
  lookY: 0,
  /** dim the whole screen (used for the final blackout) */
  power: 1,
}

export function setBot(p: Partial<BotState>) {
  for (const k in p) {
    const key = k as keyof BotState
    T[key] = p[key] as number
  }
}

export function setExpr(e: Expr) {
  if (faceState.expr !== e) faceState.expr = e
}

/** Scroll momentum (px/frame, smoothed) — fed into the bot for physical feel. */
export const scroll = {
  velocity: 0,
  smooth: 0,
  progress: 0,
  section: 'hero',
}

/** Choreography-driven gaze bias, combined with live cursor tracking in the scene. */
export const lookBias = { x: 0, y: 0 }

export const pointer = {
  x: 0,
  y: 0,
  nx: 0,
  ny: 0,
  active: false,
}

/** Runtime app flags shared across modules. */
export const appState = { booted: false }

export const quality = {
  mobile: false,
  reduced: false,
  dpr: 1,
}

if (typeof window !== 'undefined') {
  const mm = (q: string) => window.matchMedia(q).matches
  quality.mobile = mm('(max-width: 880px)') || mm('(pointer: coarse)')
  quality.reduced = mm('(prefers-reduced-motion: reduce)')
  quality.dpr = Math.min(window.devicePixelRatio || 1, quality.mobile ? 1.6 : 2)
}

/* ---------------- tiny event bus for UI ---------------- */
type SectionListener = (id: string) => void
type ProgressListener = (p: number) => void
const sectionListeners = new Set<SectionListener>()
const progressListeners = new Set<ProgressListener>()

export function onSection(cb: SectionListener) {
  sectionListeners.add(cb)
  return () => sectionListeners.delete(cb)
}
export function onProgress(cb: ProgressListener) {
  progressListeners.add(cb)
  return () => progressListeners.delete(cb)
}
export function emitSection(id: string) {
  sectionListeners.forEach((f) => f(id))
}
export function emitProgress(p: number) {
  progressListeners.forEach((f) => f(p))
}
