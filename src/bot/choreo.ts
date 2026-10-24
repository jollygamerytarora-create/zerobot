import { emitSection, quality, setBot, setExpr, lookBias, scroll, T, type Expr } from './store'

/**
 * Every section owns a slice of the story. ScrollTrigger reports normalized
 * progress through `applyChoreo`, which writes *desired* values into T.
 * The scene damps toward them, which is what gives the product its weight.
 */

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)

let currentSection = ''

export function applyChoreo(section: string, p: number) {
  p = clamp(p)
  scroll.section = section
  scroll.progress = p
  if (currentSection !== section) {
    currentSection = section
    const el = document.documentElement
    if (el.dataset.bg !== section) el.dataset.bg = section
    emitSection(section)
  }

  lookBias.x = 0
  lookBias.y = 0
  setBot({
    x: 0,
    y: 0,
    z: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    scale: 1,
    rim: 0.55,
    screen: 1,
    explode: 0,
    glow: 0.55,
    particles: 0.3,
    flow: 0.15,
    camZ: 7.6,
    dim: 1,
  })

  switch (section) {
    /* ------------------------- 1. HERO ------------------------- */
    case 'hero': {
      const s = smooth(p)
      setBot({
        y: mix(-0.42, -0.58, s),
        z: s * 1.5,
        scale: 0.97 + s * 0.14,
        camZ: 7.6 - s * 0.75,
        ry: mix(-0.14, 0.08, s),
        rx: mix(0.03, -0.02, s),
        rim: mix(0.32, 1.0, s),
        glow: mix(0.34, 0.8, s),
        particles: mix(0.12, 0.42, s),
      })
      setExpr(p > 0.55 ? 'curious' : 'calm')
      lookBias.y = mix(0, -0.25, s)
      break
    }

    /* ---------------------- 2. THE CHARACTER -------------------- */
    case 'character': {
      const cycle: [number, Expr][] = [
        [0.02, 'calm'],
        [0.08, 'happy'],
        [0.15, 'curious'],
        [0.22, 'surprised'],
        [0.29, 'thinking'],
        [0.36, 'sleepy'],
        [0.43, 'excited'],
        [0.5, 'confused'],
        [0.57, 'wink'],
        [0.63, 'cool'],
        [0.7, 'happy'],
      ]
      let e: Expr = 'calm'
      for (const [at, ex] of cycle) if (p >= at) e = ex
      if (p > 0.78) e = 'curious'
      setExpr(e)

      const shift = smooth(seg(p, 0.66, 0.86))
      setBot({
        x: shift * 1.28,
        scale: 1.1 - shift * 0.06,
        ry: Math.sin(p * Math.PI * 3) * 0.1 + shift * 0.22,
        rim: 0.7 + Math.sin(p * Math.PI * 4) * 0.14,
        glow: 0.6,
        particles: 0.34,
        camZ: 7.3,
      })
      lookBias.x = shift * -0.4
      break
    }

    /* -------------------------- 3. SEE ------------------------- */
    case 'see': {
      const inT = smooth(seg(p, 0, 0.18))
      setBot({
        x: mix(0, -1.42, inT),
        scale: 1.06,
        ry: mix(0, 0.52, smooth(seg(p, 0.1, 0.55))) + Math.sin(p * 6) * 0.04,
        rx: -0.03,
        rim: 0.85,
        glow: 0.6,
        particles: 0.5,
        flow: 0.3,
        camZ: 7.3,
      })
      setExpr(p > 0.72 ? 'curious' : p > 0.3 ? 'curious' : 'calm')
      lookBias.x = mix(0, 0.85, smooth(seg(p, 0.15, 0.5)))
      lookBias.y = -0.18
      break
    }

    /* -------------------------- 4. HEAR ------------------------ */
    case 'hear': {
      const c = smooth(seg(p, 0, 0.16))
      setBot({
        x: mix(-1.42, 0, c),
        scale: 1.16,
        ry: mix(0.52, 0, c),
        rim: 0.6 + Math.sin(p * Math.PI * 7) * 0.22 * seg(p, 0.18, 0.6),
        glow: 0.62,
        particles: 0.4,
        camZ: 7.2,
      })
      if (p < 0.2) setExpr('calm')
      else if (p < 0.55) setExpr('listening')
      else if (p < 0.82) setExpr('talking')
      else setExpr('happy')
      break
    }

    /* ------------------------- 5. THINK ------------------------ */
    case 'think': {
      const a = smooth(seg(p, 0, 0.7))
      const collapse = smooth(seg(p, 0.78, 1))
      setBot({
        ry: mix(-0.7, 0.85, a),
        rx: mix(0.06, -0.06, a),
        scale: 1.02 + a * 0.08 - collapse * 0.1,
        rim: 0.75 + a * 0.25,
        glow: 0.35 + a * 0.5 - collapse * 0.45,
        particles: 0.35 + a * 0.45 - collapse * 0.55,
        flow: (0.3 + a * 0.8) * (1 - collapse),
        camZ: 7.4 - a * 0.5,
      })
      setExpr(p > 0.86 ? 'calm' : 'thinking')
      lookBias.x = mix(-0.3, 0.3, a)
      lookBias.y = -0.3
      break
    }

    /* ------------------- 6. THE BODY (360°) -------------------- */
    case 'body': {
      setBot({
        ry: p * Math.PI * 2,
        rx: Math.sin(p * Math.PI * 2) * 0.06,
        scale: 1.08,
        rim: 0.8,
        glow: 0.5,
        particles: 0.22,
        flow: 0.05,
        camZ: 7.2,
        y: -0.25,
      })
      setExpr('calm')
      lookBias.x = Math.sin(p * Math.PI * 2) * -0.4
      break
    }

    /* --------------------- 7. THE DISPLAY ---------------------- */
    case 'display': {
      const inT = smooth(seg(p, 0, 0.3))
      const outT = smooth(seg(p, 0.76, 1))
      const zoom = inT * (1 - outT)
      setBot({
        scale: mix(1.24, 3.15, zoom),
        camZ: mix(7.2, 6.5, zoom),
        ry: Math.PI * 2 + mix(0, 0.5, smooth(seg(p, 0, 0.32))) - outT * 0.5,
        y: mix(0, 0.05, zoom),
        rim: 0.9,
        glow: 0.6,
        particles: 0.2,
        flow: 0.05,
      })
      const cycle: [number, Expr][] = [
        [0.3, 'happy'],
        [0.38, 'curious'],
        [0.46, 'surprised'],
        [0.54, 'wink'],
        [0.62, 'sleepy'],
        [0.7, 'cool'],
      ]
      let e: Expr = 'calm'
      for (const [at, ex] of cycle) if (p >= at) e = ex
      setExpr(e)
      break
    }

    /* ------------------- 8. EXPLODED REVEAL ------------------- */
    case 'exploded': {
      const setup = smooth(seg(p, 0, 0.16))
      const open = smooth(seg(p, 0.16, 0.56))
      const close = smooth(seg(p, 0.68, 0.94))
      const ex = open * (1 - close)
      setBot({
        explode: ex,
        x: 0,
        scale: mix(1.15, 0.86, setup),
        ry: mix(0, 0.5, setup),
        rx: mix(0, 0.13, setup),
        rim: 0.85 - ex * 0.25,
        glow: 0.55,
        particles: 0.3,
        flow: 0.12,
        camZ: 7.5,
      })
      setExpr(ex > 0.2 ? 'curious' : 'calm')
      lookBias.x = -0.25
      break
    }

    /* --------------------- 9. INTERACTION ---------------------- */
    case 'interact': {
      const c = smooth(seg(p, 0, 0.14))
      setBot({
        x: mix(0, 1.15, c),
        scale: 1.12,
        ry: mix(0.5, -0.16, c),
        rim: 0.72 + Math.sin(p * Math.PI * 6) * 0.14,
        glow: 0.6,
        particles: 0.32,
        camZ: 7.3,
      })
      if (p < 0.13) setExpr('calm')
      else if (p < 0.24) setExpr('listening')
      else if (p < 0.4) setExpr('talking')
      else if (p < 0.5) setExpr('curious')
      else if (p < 0.62) setExpr('listening')
      else if (p < 0.76) setExpr('talking')
      else if (p < 0.88) setExpr('confused')
      else setExpr('cool')
      lookBias.x = -0.3
      break
    }

    /* --------------------- 10. PERSONALITY --------------------- */
    case 'personality': {
      const stops: [number, number, number][] = [
        [0, 2.35, 0.25],
        [0.18, 1.35, 0.05],
        [0.38, -1.7, -0.15],
        [0.56, -0.15, 0.6],
        [0.74, 1.6, -0.4],
        [1, 0, 0.1],
      ]
      let x = 0
      let y = 0
      for (let i = 0; i < stops.length - 1; i++) {
        const [a, ax, ay] = stops[i]
        const [b, bx, by] = stops[i + 1]
        if (p >= a && p <= b) {
          const t = smooth(seg(p, a, b))
          x = mix(ax, bx, t)
          y = mix(ay, by, t)
        }
      }
      const cycle: [number, Expr][] = [
        [0, 'curious'],
        [0.2, 'wink'],
        [0.36, 'confused'],
        [0.5, 'happy'],
        [0.64, 'surprised'],
        [0.78, 'wink'],
        [0.9, 'happy'],
      ]
      let e: Expr = 'happy'
      for (const [at, ex] of cycle) if (p >= at) e = ex
      setExpr(e)
      setBot({
        x,
        y,
        scale: 1.0,
        ry: -x * 0.16,
        rx: -y * 0.2,
        rim: 0.8,
        glow: 0.6,
        particles: 0.35,
        flow: 0.2,
        camZ: 7.4,
      })
      break
    }

    /* ------------------ 11. IN YOUR SPACE ---------------------- */
    case 'space': {
      setBot({
        x: 0.75,
        y: -0.1,
        scale: 1.0,
        ry: Math.sin(p * Math.PI * 3) * 0.42,
        rx: 0.03,
        rim: 0.75,
        glow: 0.7,
        particles: 0.24,
        flow: 0.1,
        camZ: 7.3,
      })
      const e: Expr = p < 0.3 ? 'calm' : p < 0.55 ? 'happy' : p < 0.8 ? 'curious' : 'calm'
      setExpr(e)
      lookBias.y = 0.2
      break
    }

    /* ------------------ 12. FEATURE WALL ----------------------- */
    case 'features': {
      setBot({
        x: 0,
        y: 0,
        scale: 0.92,
        ry: Math.sin(p * Math.PI * 4) * 0.34,
        rim: 0.85,
        glow: 0.55,
        particles: 0.4,
        flow: 0.25,
        camZ: 7.5,
      })
      setExpr(p < 0.5 ? 'curious' : 'calm')
      break
    }

    /* -------------------- 13. TECHNICAL ------------------------ */
    case 'tech': {
      const t = smooth(seg(p, 0, 0.35))
      setBot({
        x: mix(0, 0.02, t),
        y: mix(0, -0.45, t),
        scale: mix(0.92, 0.66, t),
        ry: mix(0, -0.6, t),
        rx: 0.05,
        rim: 0.7,
        glow: 0.5,
        particles: 0.2,
        flow: 0.08,
        camZ: 7.5,
      })
      setExpr('calm')
      lookBias.x = -0.5
      break
    }

    /* ---------------- 14. FINAL TRANSFORMATION ----------------- */
    case 'final': {
      const approach = smooth(seg(p, 0, 0.42))
      const push = smooth(seg(p, 0.42, 0.68))
      const blackout = smooth(seg(p, 0.7, 0.8))
      const reveal = smooth(seg(p, 0.86, 1))
      const z = mix(-5.4, 0.4, approach) + push * 2.4
      setBot({
        z,
        scale: mix(0.48, 1.16, approach) + push * 0.22 - reveal * 0.08,
        y: mix(-0.4, 0, approach) + push * 0.06,
        ry: mix(-1.5, 0.1, approach) + push * 0.16 - reveal * 0.1,
        rx: mix(0.24, 0, approach),
        rim: mix(0.06, 1, approach) * (1 - blackout) + reveal * 0.95,
        glow: mix(0.06, 0.9, approach) * (1 - blackout) + reveal * 0.85,
        particles: mix(0.05, 0.5, approach) * (1 - blackout) + reveal * 0.35,
        flow: mix(0.05, 0.5, approach) * (1 - blackout),
        camZ: mix(8.6, 7.2, approach),
        dim: Math.max(reveal, 1 - blackout),
      })
      if (p < 0.3) setExpr('sleepy')
      else if (p < 0.55) setExpr('calm')
      else if (p < 0.7) setExpr('surprised')
      else setExpr('happy')
      lookBias.y = p < 0.4 ? 0.4 : 0
      break
    }

    /* ----------------------- FINAL CTA ------------------------- */
    case 'cta': {
      const a = smooth(seg(p, 0.1, 0.45))
      const out = smooth(seg(p, 0.5, 0.8))
      setBot({
        z: 0.4,
        scale: 0.74 + a * 0.06,
        y: mix(0.5, 0.28, a) + out * 1.5,
        ry: mix(-0.2, 0.05, a),
        rim: 0.95 * (1 - out * 0.6),
        glow: 0.8 * (1 - out * 0.7),
        particles: 0.32,
        flow: 0.15,
        camZ: 7.4,
        dim: 1 - out * 0.92,
      })
      setExpr('happy')
      break
    }
  }

  // --- viewport adaptation: never shrink the desktop layout ---
  if (quality.mobile) {
    T.x *= 0.16
    T.y = T.y * 0.8 - 0.72
    T.scale *= 0.74
    T.camZ += 0.5
    // the hero copy stacks under the product on small screens — lift the bot
    // into the clear zone above the headline so type never sits on its face
    if (section === 'hero') {
      T.y += 2.15
      T.scale *= 0.92
    }
  } else if (window.innerWidth < 1100) {
    T.x *= 0.72
    T.scale *= 0.94
  }
}
