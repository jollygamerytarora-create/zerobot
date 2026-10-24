/**
 * Crops the OG card out of the full-viewport screenshot.
 *   node scripts/og-crop.mjs <input.png> <output.png>
 * The page renders the 1200x630 card at (140,140) inside a 1440x830
 * viewport, so the preview app's overlay (top-left corner) is excluded.
 * Output size accounts for devicePixelRatio.
 */
import zlib from 'node:zlib'
import fs from 'node:fs'

const [, , inFile, outFile] = process.argv
if (!inFile || !outFile) {
  console.error('usage: node scripts/og-crop.mjs <in.png> <out.png>')
  process.exit(1)
}

const VIEW_W = 1440
const CARD_X = 140
const CARD_Y = 140
const CARD_W = 1200
const CARD_H = 630

/* ------------------------------ PNG decoder ------------------------------ */

function readPNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let pos = 8
  let w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0
  const idats = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0)
      h = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
    } else if (type === 'IDAT') idats.push(data)
    pos += 12 + len
    if (type === 'IEND') break
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`)
  if (interlace !== 0) throw new Error('interlaced PNG unsupported')
  if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported color type ${colorType}`)
  const bpp = colorType === 6 ? 4 : 3
  const raw = zlib.inflateSync(Buffer.concat(idats))
  const stride = w * bpp
  const px = Buffer.alloc(h * stride)
  let src = 0
  for (let y = 0; y < h; y++) {
    const filter = raw[src++]
    const row = raw.subarray(src, src + stride)
    src += stride
    const out = px.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= bpp ? prev[i - bpp] : 0
      let v = row[i]
      switch (filter) {
        case 0: break
        case 1: v += a; break
        case 2: v += b; break
        case 3: v += (a + b) >> 1; break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
          break
        }
        default: throw new Error(`bad filter ${filter}`)
      }
      out[i] = v & 0xff
    }
  }
  return { w, h, bpp, px }
}

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

function encodePNG(w, h, px, bpp) {
  // normalize to RGBA; RGB input gets an opaque alpha channel
  const stride = w * 4
  const strideIn = w * bpp
  const plain = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const src = px.subarray(y * strideIn, (y + 1) * strideIn)
    if (bpp === 4) src.copy(plain, y * stride)
    else
      for (let i = 0, j = 0; i < w; i++, j += 4) {
        plain[y * stride + j] = src[i * 3]
        plain[y * stride + j + 1] = src[i * 3 + 1]
        plain[y * stride + j + 2] = src[i * 3 + 2]
        plain[y * stride + j + 3] = 255
      }
  }
  const raw2 = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw2[y * (stride + 1)] = y === 0 ? 1 : 2
    const cur = plain.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? plain.subarray((y - 1) * stride, y * stride) : null
    const dst = raw2.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? cur[i - 4] : 0
      const b = prev ? prev[i] : 0
      dst[i] = (cur[i] - (y === 0 ? a : b)) & 0xff
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw2, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* --------------------------------- crop ---------------------------------- */

const img = readPNG(fs.readFileSync(inFile))
const s = img.w / VIEW_W
const x0 = Math.round(CARD_X * s)
const y0 = Math.round(CARD_Y * s)
const cw = Math.round(CARD_W * s)
const ch = Math.round(CARD_H * s)
console.log(`input ${img.w}x${img.h} scale=${s} -> crop ${cw}x${ch} at (${x0},${y0})`)

const out = Buffer.alloc(cw * ch * img.bpp)
for (let y = 0; y < ch; y++) {
  const src = img.px.subarray((y + y0) * img.w * img.bpp + x0 * img.bpp, (y + y0) * img.w * img.bpp + (x0 + cw) * img.bpp)
  src.copy(out, y * cw * img.bpp)
}
fs.writeFileSync(outFile, encodePNG(cw, ch, out, img.bpp))
console.log('wrote', outFile, `${(fs.statSync(outFile).size / 1024).toFixed(0)} KB`)
