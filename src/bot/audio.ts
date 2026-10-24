/** Tiny synthesised UI sounds — never autoplayed, opt-in only. */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = false
let last = 0

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.16
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

export function isSoundOn() {
  return enabled
}

export function setSound(on: boolean) {
  enabled = on
  try {
    localStorage.setItem('zero-sound', on ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (on) {
    ensure()
    blip(880, 0.06, 0.5)
  }
}

export function initSound() {
  try {
    enabled = localStorage.getItem('zero-sound') === '1'
  } catch {
    enabled = false
  }
  return enabled
}

function tone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  if (!enabled) return
  const c = ensure()
  if (!c || !master) return
  const now = c.currentTime
  if (now - last < 0.02) return
  last = now
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, now)
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(vol, now + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  o.connect(g)
  g.connect(master)
  o.start(now)
  o.stop(now + dur + 0.02)
}

function blip(freq: number, dur: number, vol: number) {
  tone(freq, dur, vol, 'sine')
}

export const sfx = {
  click: () => {
    tone(1180, 0.05, 0.35, 'triangle')
    tone(620, 0.09, 0.2, 'sine')
  },
  hover: () => tone(1560, 0.035, 0.1, 'sine'),
  section: () => {
    tone(320, 0.32, 0.14, 'sine')
    tone(480, 0.24, 0.07, 'sine')
  },
  reveal: () => {
    tone(180, 0.6, 0.14, 'sine')
    tone(90, 0.7, 0.1, 'triangle')
  },
}
