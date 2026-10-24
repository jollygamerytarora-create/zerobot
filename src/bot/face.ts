import * as THREE from 'three'
import { faceState, type Expr } from './store'

/**
 * The Zero Bot face is not an emoji sprite — it is a parametric character
 * rendered to a canvas and used as the display's emissive map.
 * Expressions are parameter presets that morph smoothly into one another.
 */

interface Params {
  eyeOpen: number
  eyeWide: number
  eyeTilt: number
  pupilX: number
  pupilY: number
  pupilSize: number
  browShow: number
  browLift: number
  browAngle: number
  mouthCurve: number
  mouthOpen: number
  mouthW: number
  mouthWave: number
  lidCurve: number
  blush: number
  shades: number
  tongue: number
  mic: number
  wink: number
}

const DEFAULTS: Params = {
  eyeOpen: 0.92,
  eyeWide: 1,
  eyeTilt: 0,
  pupilX: 0,
  pupilY: 0,
  pupilSize: 1,
  browShow: 1,
  browLift: 0,
  browAngle: 0,
  mouthCurve: 0.5,
  mouthOpen: 0.04,
  mouthW: 1,
  mouthWave: 0,
  lidCurve: 0,
  blush: 0,
  shades: 0,
  tongue: 0,
  mic: 0,
  wink: 0,
}

const PRESETS: Record<Expr, Partial<Params>> = {
  calm: { eyeOpen: 0.92, mouthCurve: 0.5, mouthOpen: 0.04, browLift: 0.06 },
  curious: {
    eyeOpen: 1.04,
    eyeWide: 1.05,
    pupilX: 0.24,
    pupilY: -0.1,
    browLift: 0.5,
    browAngle: 0.35,
    mouthCurve: 0.2,
    mouthOpen: 0.1,
    mouthW: 0.72,
  },
  happy: {
    eyeOpen: 0.16,
    lidCurve: 1,
    mouthCurve: 0.95,
    mouthOpen: 0.14,
    browLift: 0.34,
    blush: 0.55,
  },
  surprised: {
    eyeOpen: 1.18,
    eyeWide: 1.14,
    pupilSize: 0.72,
    browLift: 0.8,
    mouthCurve: 0,
    mouthOpen: 0.58,
    mouthW: 0.62,
    lidCurve: 0,
  },
  wow: {
    eyeOpen: 1.18,
    eyeWide: 1.14,
    pupilSize: 0.72,
    browLift: 0.8,
    mouthCurve: 0,
    mouthOpen: 0.58,
    mouthW: 0.62,
  },
  thinking: {
    eyeOpen: 0.8,
    pupilX: 0.3,
    pupilY: -0.42,
    browLift: 0.42,
    browAngle: -0.5,
    mouthCurve: -0.12,
    mouthOpen: 0.03,
    mouthW: 0.8,
  },
  sleepy: {
    eyeOpen: 0.2,
    lidCurve: -0.7,
    browLift: -0.4,
    mouthCurve: 0.28,
    mouthOpen: 0.1,
    mouthW: 0.7,
    pupilY: 0.2,
  },
  excited: {
    eyeOpen: 1.08,
    eyeWide: 1.06,
    browLift: 0.7,
    mouthCurve: 0.7,
    mouthOpen: 0.62,
    mouthW: 1.05,
    blush: 0.4,
    tongue: 0.5,
  },
  confused: {
    eyeOpen: 0.9,
    eyeTilt: 0.16,
    pupilX: -0.2,
    pupilY: 0.12,
    browLift: 0.3,
    browAngle: 0.7,
    mouthCurve: 0,
    mouthOpen: 0.06,
    mouthW: 0.86,
    mouthWave: 1,
  },
  wink: {
    eyeOpen: 1,
    mouthCurve: 0.85,
    mouthOpen: 0.1,
    browLift: 0.4,
    browAngle: 0.3,
    blush: 0.5,
    wink: 1,
  },
  cool: {
    eyeOpen: 1,
    shades: 1,
    mouthCurve: 0.6,
    mouthOpen: 0.05,
    browLift: 0.1,
  },
  listening: {
    eyeOpen: 1.08,
    eyeWide: 1.05,
    pupilSize: 0.85,
    browLift: 0.45,
    mouthCurve: 0.3,
    mouthOpen: 0.09,
    mouthW: 0.8,
    mic: 1,
  },
  talking: {
    eyeOpen: 0.95,
    browLift: 0.3,
    mouthCurve: 0.55,
    mouthOpen: 0.3,
    mouthW: 0.9,
  },
}

const SIZE = 900
const CX = SIZE / 2
const CY = SIZE / 2
const EYE_R = 118
const EYE_DX = 178
const EYE_Y = 428
const MOUTH_Y = 660
const EYE_WHITE_TOP = '#ffffff'
const EYE_WHITE_BOT = '#bfe0ff'
const GLOW = 'rgba(120,190,255,'
const INK = '#04101f'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v
}

export class Face {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: THREE.CanvasTexture
  private cur: Params = { ...DEFAULTS }
  private tgt: Params = { ...DEFAULTS }
  private blink = 0
  private nextBlink = 1.6
  private lookX = 0
  private lookY = 0
  private lastDraw = 0
  private talkPhase = 0
  private dirty = true
  private res = 1

  constructor(size = SIZE) {
    // the whole face is authored in a 900px design space; on mobile the
    // canvas is smaller, so we scale the context to keep it aligned
    this.res = size / SIZE
    this.canvas = document.createElement('canvas')
    this.canvas.width = size
    this.canvas.height = size
    this.ctx = this.canvas.getContext('2d', { alpha: true })!
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.anisotropy = 4
    this.setExpression(faceState.expr, true)
    this.draw(0)
  }

  setExpression(e: Expr, immediate = false) {
    const p = { ...DEFAULTS, ...(PRESETS[e] ?? PRESETS.calm) }
    this.tgt = p
    if (immediate) this.cur = { ...p }
    this.dirty = true
  }

  update(dt: number, t: number) {
    // morph
    const k = 1 - Math.exp(-dt * 11)
    let moving = false
    for (const key of Object.keys(this.cur) as (keyof Params)[]) {
      const nv = lerp(this.cur[key], this.tgt[key], k)
      if (Math.abs(nv - this.cur[key]) > 0.0006) moving = true
      this.cur[key] = nv
    }

    // natural blinking, even when idle
    let blinkOpen = 1
    if (faceState.blink) {
      this.nextBlink -= dt
      if (this.nextBlink <= 0) {
        this.blink = Math.min(1, this.blink + dt * 13)
        if (this.blink >= 1) {
          this.nextBlink = 2.1 + Math.random() * 3.4
          this.blink = 0
          this.blinkPhase = 0
        }
      } else if (this.blinkPhase === 1) {
        this.blink += dt * 13
        if (this.blink >= 1) {
          this.blink = 0
          this.blinkPhase = 0
          this.nextBlink = 2.1 + Math.random() * 3.4
        }
      }
      blinkOpen = 1 - this.blink
    }

    // eye look (smoothed, biased by choreography)
    const lx = clamp(faceState.lookX, -1, 1)
    const ly = clamp(faceState.lookY, -1, 1)
    const lk = 1 - Math.exp(-dt * 7)
    const before = this.lookX + this.lookY
    this.lookX = lerp(this.lookX, lx, lk)
    this.lookY = lerp(this.lookY, ly, lk)
    if (Math.abs(this.lookX + this.lookY - before) > 0.0015) moving = true

    // talking mouth
    if (faceState.expr === 'talking') {
      this.talkPhase += dt * 12
      const osc = 0.5 + 0.5 * Math.sin(this.talkPhase) * Math.sin(this.talkPhase * 0.37 + 1.2)
      this.cur.mouthOpen = lerp(this.cur.mouthOpen, 0.16 + osc * 0.5, 0.35)
      moving = true
    }

    if (!moving && !this.dirty) return
    const now = performance.now()
    if (now - this.lastDraw < 33 && !this.dirty) return
    this.lastDraw = now
    this.dirty = false
    this.draw(t, blinkOpen)
  }

  private blinkPhase = 0

  draw(t: number, blinkOpen = 1) {
    const ctx = this.ctx
    const p = this.cur
    ctx.setTransform(this.res, 0, 0, this.res, 0, 0)
    ctx.clearRect(0, 0, SIZE, SIZE)

    // ---- display glass background (rounded square, transparent corners) ----
    const r = 168
    ctx.save()
    roundRect(ctx, 6, 6, SIZE - 12, SIZE - 12, r)
    ctx.clip()
    const bgGrad = ctx.createRadialGradient(CX, CY * 0.86, 40, CX, CY, SIZE * 0.72)
    bgGrad.addColorStop(0, '#04060c')
    bgGrad.addColorStop(1, '#010205')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, SIZE, SIZE)

    // faint depth vignette
    const vig = ctx.createLinearGradient(0, 0, 0, SIZE)
    vig.addColorStop(0, 'rgba(60,120,210,0.055)')
    vig.addColorStop(0.4, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,0.4)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, SIZE, SIZE)

    const open = p.eyeOpen * blinkOpen
    const wide = p.eyeWide

    // ---- blush ----
    if (p.blush > 0.02) {
      for (const s of [-1, 1]) {
        const g = ctx.createRadialGradient(
          CX + s * 300,
          EYE_Y + 168,
          4,
          CX + s * 300,
          EYE_Y + 168,
          96,
        )
        g.addColorStop(0, `rgba(255,120,150,${0.5 * p.blush})`)
        g.addColorStop(1, 'rgba(255,120,150,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(CX + s * 300, EYE_Y + 168, 96, 62, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ---- brows ----
    if (p.browShow > 0.05) {
      ctx.save()
      ctx.globalAlpha = p.browShow
      ctx.strokeStyle = 'rgba(226,242,255,0.92)'
      ctx.lineWidth = 15
      ctx.lineCap = 'round'
      ctx.shadowColor = GLOW + '0.75)'
      ctx.shadowBlur = 22
      for (const s of [-1, 1]) {
        const bx = CX + s * EYE_DX
        const by = EYE_Y - EYE_R - 58 - p.browLift * 52
        const tilt = p.browAngle * s
        ctx.beginPath()
        ctx.moveTo(bx - 66, by + 26 * -tilt + 14)
        ctx.quadraticCurveTo(bx, by - 34 + 10 * tilt, bx + 66, by + 26 * tilt + 14)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ---- eyes ----
    drawEye(ctx, CX - EYE_DX, EYE_Y, EYE_R, open, wide, p, this.lookX, this.lookY, -1)
    drawEye(
      ctx,
      CX + EYE_DX,
      EYE_Y,
      EYE_R,
      open * (1 - p.wink),
      wide,
      p,
      this.lookX,
      this.lookY,
      1,
    )

    // ---- mouth ----
    drawMouth(ctx, CX, MOUTH_Y, p, t)

    // ---- sunglasses ----
    if (p.shades > 0.03) drawShades(ctx, p.shades)

    // ---- mic arcs (listening) ----
    if (p.mic > 0.03) {
      ctx.save()
      ctx.globalAlpha = p.mic * 0.75
      ctx.strokeStyle = GLOW + '0.9)'
      ctx.lineCap = 'round'
      for (let i = 0; i < 3; i++) {
        const rr = 300 + i * 46
        const puls = 0.55 + 0.45 * Math.sin(t * 3.4 - i * 0.9)
        ctx.lineWidth = 7 - i * 1.4
        ctx.globalAlpha = p.mic * (0.5 - i * 0.12) * puls
        for (const s of [-1, 1]) {
          ctx.beginPath()
          ctx.arc(CX, CY - 30, rr, s > 0 ? -0.42 : Math.PI - 0.42, s > 0 ? 0.42 : Math.PI + 0.42)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    ctx.restore()
    this.texture.needsUpdate = true
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  open: number,
  wide: number,
  p: Params,
  lookX: number,
  lookY: number,
  side: number,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(p.eyeTilt * side)

  // happy / closed eye: a soft curved lid line
  if (open <= 0.26) {
    const curve = p.lidCurve
    ctx.strokeStyle = 'rgba(238,248,255,0.98)'
    ctx.lineWidth = 26
    ctx.lineCap = 'round'
    ctx.shadowColor = GLOW + '0.85)'
    ctx.shadowBlur = 34
    ctx.beginPath()
    const span = R * 1.05 * wide
    const sag = 46 * curve
    ctx.moveTo(-span, 6 - sag * 0.35)
    ctx.quadraticCurveTo(0, -sag - 6, span, 6 - sag * 0.35)
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.restore()
    return
  }

  const ry = R * Math.min(open, 1.18)
  const rx = R * wide

  // outer halo — smooth 3-stop falloff so no hard disc edge appears at zoom
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 1.55)
  halo.addColorStop(0, GLOW + '0.04)')
  halo.addColorStop(0.5, GLOW + '0.24)')
  halo.addColorStop(0.72, GLOW + '0.16)')
  halo.addColorStop(1, GLOW + '0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.ellipse(0, 0, rx * 1.55, Math.max(ry * 1.7, rx * 1.15), 0, 0, Math.PI * 2)
  ctx.fill()

  // eyeball
  const g = ctx.createLinearGradient(0, -ry, 0, ry)
  g.addColorStop(0, EYE_WHITE_TOP)
  g.addColorStop(1, EYE_WHITE_BOT)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()

  // upper lid shadow
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.clip()
  const lid = ctx.createLinearGradient(0, -ry, 0, ry * 0.5)
  lid.addColorStop(0, 'rgba(10,30,60,0.42)')
  lid.addColorStop(1, 'rgba(10,30,60,0)')
  ctx.fillStyle = lid
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2)

  // pupil
  const px = lookX * rx * 0.36
  const py = lookY * ry * 0.34 - 2
  const pr = rx * 0.5 * p.pupilSize
  ctx.beginPath()
  ctx.ellipse(px, py, pr, Math.min(pr, ry * 0.82), 0, 0, Math.PI * 2)
  ctx.fillStyle = INK
  ctx.fill()

  // iris ring glow
  ctx.strokeStyle = GLOW + '0.55)'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.ellipse(px, py, pr, Math.min(pr, ry * 0.82), 0, 0, Math.PI * 2)
  ctx.stroke()

  // highlights
  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.beginPath()
  ctx.ellipse(px - pr * 0.42, py - pr * 0.5, pr * 0.36, pr * 0.3, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.ellipse(px + pr * 0.44, py + pr * 0.46, pr * 0.18, pr * 0.15, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()

  ctx.restore()
}

function drawMouth(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Params, t: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.lineCap = 'round'
  ctx.shadowColor = GLOW + '0.8)'
  ctx.shadowBlur = 26

  const w = 128 * p.mouthW
  const open = p.mouthOpen

  if (open > 0.12) {
    // open mouth
    const h = 40 + open * 132
    ctx.beginPath()
    ctx.moveTo(-w, -6)
    ctx.quadraticCurveTo(0, -6 + open * 10, w, -6)
    ctx.quadraticCurveTo(w * 0.72, h, 0, h)
    ctx.quadraticCurveTo(-w * 0.72, h, -w, -6)
    ctx.closePath()
    const g = ctx.createLinearGradient(0, -10, 0, h)
    g.addColorStop(0, '#160a18')
    g.addColorStop(1, '#2a0f1c')
    ctx.fillStyle = g
    ctx.fill()
    if (p.tongue > 0.05) {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(-w * 0.55, h - 26)
      ctx.quadraticCurveTo(0, h - 76 * p.tongue - 10, w * 0.55, h - 26)
      ctx.quadraticCurveTo(0, h + 14, -w * 0.55, h - 26)
      ctx.fillStyle = 'rgba(255,130,150,0.92)'
      ctx.globalAlpha = p.tongue
      ctx.fill()
      ctx.restore()
    }
    // rim light
    ctx.strokeStyle = 'rgba(226,242,255,0.95)'
    ctx.lineWidth = 15
    ctx.beginPath()
    ctx.moveTo(-w, -6)
    ctx.quadraticCurveTo(0, -6 + open * 10, w, -6)
    ctx.stroke()
    ctx.restore()
    return
  }

  ctx.strokeStyle = 'rgba(236,247,255,0.98)'
  ctx.lineWidth = 22
  if (p.mouthWave > 0.25) {
    // confused squiggle
    ctx.beginPath()
    ctx.moveTo(-w, 0)
    const seg = w / 3
    for (let i = 0; i < 3; i++) {
      const x0 = -w + seg * i
      const dir = i % 2 === 0 ? 1 : -1
      ctx.quadraticCurveTo(x0 + seg * 0.5, dir * 30 * p.mouthWave, x0 + seg, 0)
    }
    ctx.stroke()
  } else {
    const c = p.mouthCurve * 78
    ctx.beginPath()
    ctx.moveTo(-w, -Math.max(0, c) * 0.32)
    ctx.quadraticCurveTo(0, c, w, -Math.max(0, c) * 0.32)
    ctx.stroke()
  }
  ctx.restore()
}

function drawShades(ctx: CanvasRenderingContext2D, a: number) {
  ctx.save()
  ctx.globalAlpha = a
  const w = 470
  const h = 150
  const y = EYE_Y - h / 2
  ctx.beginPath()
  roundRect(ctx, CX - w / 2, y, w, h, 54)
  const g = ctx.createLinearGradient(CX - w / 2, y, CX + w / 2, y + h)
  g.addColorStop(0, '#2b3ad6')
  g.addColorStop(0.5, '#4f6bff')
  g.addColorStop(1, '#7a4dff')
  ctx.fillStyle = g
  ctx.fill()
  // bridge notch
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.ellipse(CX, y + h + 6, 46, 34, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  // gloss streak
  ctx.beginPath()
  roundRect(ctx, CX - w / 2 + 26, y + 18, 132, 40, 20)
  ctx.fillStyle = 'rgba(255,255,255,0.34)'
  ctx.fill()
  ctx.restore()
}
