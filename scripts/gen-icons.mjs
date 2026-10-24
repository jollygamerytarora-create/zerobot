/**
 * Generates the Zero Bot site icons with zero dependencies.
 *   node scripts/gen-icons.mjs
 * Outputs into public/: icon-512.png, icon-192.png, apple-touch-icon.png,
 * favicon-32.png, favicon-16.png, favicon.ico
 */
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public')
fs.mkdirSync(OUT, { recursive: true })

/* ------------------------------ PNG encoder ------------------------------ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function writePNG(file, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
  fs.writeFileSync(file, png)
  return png
}

/* ----------------------------- ICO container ----------------------------- */

function writeICO(file, entries) {
  // entries: [{ size, png }]
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  const dir = []
  let offset = 6 + entries.length * 16
  for (const { size, png } of entries) {
    const e = Buffer.alloc(16)
    e[0] = size >= 256 ? 0 : size
    e[1] = size >= 256 ? 0 : size
    e[2] = 0
    e[3] = 0
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(png.length, 8)
    e.writeUInt32LE(offset, 12)
    dir.push(e)
    offset += png.length
  }
  fs.writeFileSync(file, Buffer.concat([header, ...dir, ...entries.map((e) => e.png)]))
}

/* ------------------------------- rasterizer ------------------------------ */

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
const mix = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

function sdRoundBox(u, v, cx, cy, hx, hy, r) {
  const dx = Math.abs(u - cx) - (hx - r)
  const dy = Math.abs(v - cy) - (hy - r)
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  return outside + Math.min(Math.max(dx, dy), 0) - r
}

function sdEllipse(u, v, cx, cy, rx, ry) {
  const nu = (u - cx) / rx
  const nv = (v - cy) / ry
  return (Math.hypot(nu, nv) - 1) * Math.min(rx, ry)
}

/**
 * Draws the Zero Bot mark into an RGBA buffer.
 * solid = full-bleed dark background (apple-touch / manifest icons)
 * detail = pupils + mouth (skipped at tiny sizes)
 */
function drawBot(S, { solid = false, detail = true } = {}) {
  const rgba = new Uint8Array(S * S * 4)
  const ss = S >= 128 ? 4 : 2 // supersampling
  const C_BODY_TOP = hex('#2e384c')
  const C_BODY_BOT = hex('#0a0d14')
  const C_SCREEN_TOP = hex('#04070e')
  const C_SCREEN_BOT = hex('#010204')
  const C_RIM = hex('#4d9dff')
  const C_EYE_TOP = hex('#ffffff')
  const C_EYE_BOT = hex('#b7dbff')
  const C_PUPIL = hex('#0a2c5e')
  const px = 1 / S

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          let cr = 0, cg = 0, cb = 0, ca = 0
          const u = (x + (sx + 0.5) / ss) / S
          const v = (y + (sy + 0.5) / ss) / S
          const over = (nr, ng, nb, na) => {
            cr = nr * na + cr * (1 - na)
            cg = ng * na + cg * (1 - na)
            cb = nb * na + cb * (1 - na)
            ca = na + ca * (1 - na)
          }

          if (solid) over(0.02, 0.027, 0.047, 1)

          const dBody = sdRoundBox(u, v, 0.5, 0.5, 0.44, 0.44, 0.21)

          // ambient blue glow behind the body
          const glow = Math.exp(-Math.max(dBody, 0) / 0.16) * (solid ? 0.16 : 0.3)
          over(0.16, 0.4, 0.95, glow * (1 - ca))

          // body
          if (dBody < 0) {
            const t = clamp01((v - 0.06) / 0.88)
            const rimLight = clamp01(1 - (u + v)) // brighter toward top-left
            const k = 0.22 * rimLight * (1 - clamp01(-dBody / 0.09))
            over(
              mix(C_BODY_TOP[0], C_BODY_BOT[0], t) + 90 * k,
              mix(C_BODY_TOP[1], C_BODY_BOT[1], t) + 110 * k,
              mix(C_BODY_TOP[2], C_BODY_BOT[2], t) + 140 * k,
              1,
            )
          }

          // body edge highlight
          const edge = Math.exp(-Math.abs(dBody) / (0.8 * px)) * 0.5
          if (edge > 0.01) {
            const dir = clamp01(1.35 - (u * 0.9 + v * 1.1))
            over(130, 170, 240, edge * dir * (solid ? 0.35 : 0.55))
          }

          const dScr = sdRoundBox(u, v, 0.5, 0.515, 0.325, 0.315, 0.145)

          // screen glass
          if (dScr < 0) {
            const t = clamp01((v - 0.2) / 0.65)
            over(mix(C_SCREEN_TOP[0], C_SCREEN_BOT[0], t), mix(C_SCREEN_TOP[1], C_SCREEN_BOT[1], t), mix(C_SCREEN_TOP[2], C_SCREEN_BOT[2], t), 1)
          }

          // electric-blue rim around the display
          const rimGlow = Math.exp(-Math.abs(dScr) / (2.6 * px)) * 0.85 + Math.exp(-Math.max(dScr, 0) / 0.05) * 0.28
          if (rimGlow > 0.015) over(C_RIM[0], C_RIM[1], C_RIM[2], rimGlow)

          // eyes
          const erx = 0.088
          const ery = 0.112
          for (const ex of [0.372, 0.628]) {
            const dEye = sdEllipse(u, v, ex, 0.475, erx, ery)
            const halo = Math.exp(-Math.max(dEye, 0) / 0.05) * 0.34
            if (halo > 0.01) over(110, 175, 255, halo)
            if (dEye < 0) {
              const t = clamp01((v - (0.475 - ery)) / (2 * ery))
              over(mix(C_EYE_TOP[0], C_EYE_BOT[0], t), mix(C_EYE_TOP[1], C_EYE_BOT[1], t), mix(C_EYE_TOP[2], C_EYE_BOT[2], t), 1)
            }
            if (detail) {
              const dP = sdEllipse(u, v, ex + 0.012, 0.492, erx * 0.52, ery * 0.5)
              if (dP < 0) over(C_PUPIL[0], C_PUPIL[1], C_PUPIL[2], 1)
              const dSpark = sdEllipse(u, v, ex + 0.032, 0.455, erx * 0.17, ery * 0.15)
              if (dSpark < 0) over(255, 255, 255, 1)
            }
          }

          // smile
          if (detail) {
            const mx = u - 0.5
            const my = v - 0.44
            const R = 0.155
            const dSmile = Math.abs(Math.hypot(mx, my) - R)
            if (my > 0.02 && Math.abs(mx) < 0.11 && dSmile < 1.3 * px) {
              const soft = clamp01(1 - dSmile / (1.6 * px)) * 0.95
              over(190, 222, 255, soft)
            }
          }

          // accumulate (cr..cb are already premultiplied by the over() op)
          r += cr
          g += cg
          b += cb
          a += ca
        }
      }
      // colors were composited against transparent black (premultiplied);
      // un-premultiply by dividing by the summed alpha before writing
      const i = (y * S + x) * 4
      const aa = 1 / (ss * ss)
      if (a > 0.0001) {
        rgba[i] = Math.min(255, Math.round(r / a))
        rgba[i + 1] = Math.min(255, Math.round(g / a))
        rgba[i + 2] = Math.min(255, Math.round(b / a))
        rgba[i + 3] = Math.min(255, Math.round(a * 255 * aa))
      } else {
        rgba[i] = rgba[i + 1] = rgba[i + 2] = rgba[i + 3] = 0
      }
    }
  }
  return rgba
}

/* --------------------------------- build --------------------------------- */

const sizes = {
  512: { solid: true, detail: true },
  192: { solid: true, detail: true },
  180: { solid: true, detail: true }, // apple-touch-icon
  32: { solid: false, detail: false },
  16: { solid: false, detail: false },
}

const pngs = {}
// transparent variant used by the OG share card composition
{
  const rgba = drawBot(512, { solid: false, detail: true })
  pngs['512t'] = writePNG(path.join(OUT, 'icon-512-transparent.png'), 512, 512, rgba)
  console.log('wrote icon-512-transparent.png')
}
for (const [s, opts] of Object.entries(sizes)) {
  const size = Number(s)
  const rgba = drawBot(size, opts)
  const name = size === 180 ? 'apple-touch-icon.png' : size === 512 || size === 192 ? `icon-${size}.png` : `favicon-${size}.png`
  pngs[size] = writePNG(path.join(OUT, name), size, size, rgba)
  console.log('wrote', name)
}

writeICO(path.join(OUT, 'favicon.ico'), [
  { size: 32, png: pngs[32] },
  { size: 16, png: pngs[16] },
])
console.log('wrote favicon.ico')
