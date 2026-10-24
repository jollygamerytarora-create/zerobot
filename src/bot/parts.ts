import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 *  Zero Bot V1 — procedural hardware model
 *  Body: 2.10 (w) x 1.98 (h) x ~1.80 (d), soft extruded prism
 * ------------------------------------------------------------------ */

export const DIM = {
  W: 2.1,
  H: 1.98,
  R: 0.44,
  FRONT_Z0: -0.05,
  FRONT_Z1: 0.9,
  BACK_Z0: -0.9,
  BACK_Z1: 0.16,
  BEVEL: 0.09,
}

export type GroupKey =
  | 'root'
  | 'front'
  | 'back'
  | 'display'
  | 'chassis'
  | 'vision'
  | 'pcb'
  | 'speaker'
  | 'battery'

/** explode travel per group (local +Z forward) */
export const EXPLODE: Record<GroupKey, [number, number, number]> = {
  root: [0, 0, 0],
  front: [0, 0, 1.28],
  display: [0, 0.04, 2.08],
  chassis: [0, 0, 0.72],
  vision: [0, 0.2, 0.44],
  pcb: [0, 0, 0.06],
  speaker: [0, 0, -0.52],
  battery: [0, 0, -0.95],
  back: [0, 0, -1.78],
}

/* ----------------------------- helpers ---------------------------- */

export function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  const rr = Math.min(r, w / 2, h / 2)
  s.moveTo(x + rr, y)
  s.lineTo(x + w - rr, y)
  s.quadraticCurveTo(x + w, y, x + w, y + rr)
  s.lineTo(x + w, y + h - rr)
  s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  s.lineTo(x + rr, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - rr)
  s.lineTo(x, y + rr)
  s.quadraticCurveTo(x, y, x + rr, y)
  return s
}

/** Extruded prism spanning [z0, z1] with softly beveled caps. */
export function prism(
  w: number,
  h: number,
  r: number,
  z0: number,
  z1: number,
  bevel = 0.09,
  curveSegments = 14,
) {
  const depth = Math.max(0.002, z1 - z0 - 2 * bevel)
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, r), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 5,
    curveSegments,
    steps: 1,
  })
  geo.translate(0, 0, z0 + bevel)
  geo.computeVertexNormals()
  return geo
}

/* ----------------------------- textures --------------------------- */

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')!
  draw(ctx)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function grilleTexture() {
  return canvasTexture(256, 256, (c) => {
    c.fillStyle = '#1b1e24'
    c.fillRect(0, 0, 256, 256)
    const step = 17
    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 256; x += step) {
        const ox = (y / step) % 2 ? step / 2 : 0
        c.beginPath()
        c.arc(x + ox, y, 5.2, 0, Math.PI * 2)
        c.fillStyle = '#05060a'
        c.fill()
        c.beginPath()
        c.arc(x + ox, y - 1.4, 5.2, Math.PI * 1.05, Math.PI * 1.95)
        c.strokeStyle = 'rgba(120,140,170,0.35)'
        c.lineWidth = 1.4
        c.stroke()
      }
    }
  })
}

export function haloTexture() {
  const t = canvasTexture(512, 512, (c) => {
    c.clearRect(0, 0, 512, 512)
    const cx = 256
    const cy = 256
    const rx = 198
    const ry = 188
    const rr = 60
    // tight bloom
    c.save()
    c.strokeStyle = 'rgba(56,136,255,0.5)'
    c.lineWidth = 26
    c.filter = 'blur(17px)'
    roundPath(c, cx, cy, rx, ry, rr)
    c.stroke()
    c.restore()
    // inner glow
    c.save()
    c.strokeStyle = 'rgba(150,205,255,0.85)'
    c.lineWidth = 8
    c.filter = 'blur(4px)'
    roundPath(c, cx, cy, rx, ry, rr)
    c.stroke()
    c.restore()
    // crisp filament — this is the product's signature light
    c.strokeStyle = 'rgba(236,247,255,1)'
    c.lineWidth = 2.6
    c.filter = 'none'
    roundPath(c, cx, cy, rx, ry, rr)
    c.stroke()
  })
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

function roundPath(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  r: number,
) {
  const x0 = cx - rx
  const x1 = cx + rx
  const y0 = cy - ry
  const y1 = cy + ry
  c.beginPath()
  c.moveTo(x0 + r, y0)
  c.lineTo(x1 - r, y0)
  c.quadraticCurveTo(x1, y0, x1, y0 + r)
  c.lineTo(x1, y1 - r)
  c.quadraticCurveTo(x1, y1, x1 - r, y1)
  c.lineTo(x0 + r, y1)
  c.quadraticCurveTo(x0, y1, x0, y1 - r)
  c.lineTo(x0, y0 + r)
  c.quadraticCurveTo(x0, y0, x0 + r, y0)
  c.closePath()
}

export function pcbTexture() {
  return canvasTexture(512, 512, (c) => {
    c.fillStyle = '#0b2418'
    c.fillRect(0, 0, 512, 512)
    // trace field
    c.strokeStyle = '#c9a24a'
    c.lineWidth = 2
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      c.beginPath()
      c.moveTo(x, y)
      let cx = x
      let cy = y
      for (let s = 0; s < 3; s++) {
        const d = Math.random() < 0.5
        if (d) cx += (Math.random() - 0.5) * 90
        else cy += (Math.random() - 0.5) * 90
        c.lineTo(cx, cy)
      }
      c.globalAlpha = 0.35 + Math.random() * 0.4
      c.stroke()
    }
    c.globalAlpha = 1
    // vias
    for (let i = 0; i < 130; i++) {
      c.beginPath()
      c.arc(Math.random() * 512, Math.random() * 512, 2.4, 0, Math.PI * 2)
      c.fillStyle = '#e0bd6a'
      c.fill()
    }
    // silkscreen blocks
    c.fillStyle = 'rgba(230,245,255,0.55)'
    for (let i = 0; i < 16; i++) {
      c.fillRect(Math.random() * 480, Math.random() * 480, 10 + Math.random() * 30, 3)
    }
  })
}

export function dotTexture() {
  return canvasTexture(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(190,225,255,1)')
    g.addColorStop(0.35, 'rgba(120,180,255,0.55)')
    g.addColorStop(1, 'rgba(60,120,255,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 64, 64)
  })
}

export function glintTexture() {
  return canvasTexture(256, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 256, 256)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.42, 'rgba(220,240,255,0.85)')
    g.addColorStop(0.58, 'rgba(220,240,255,0.85)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
  })
}

/** Equirectangular studio environment used for reflections. */
export function environmentTexture() {
  const cv = document.createElement('canvas')
  cv.width = 1024
  cv.height = 512
  const c = cv.getContext('2d')!
  const g = c.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#121a28')
  g.addColorStop(0.45, '#070a11')
  g.addColorStop(1, '#020306')
  c.fillStyle = g
  c.fillRect(0, 0, 1024, 512)

  const soft = (x: number, y: number, rx: number, ry: number, col: string) => {
    const rg = c.createRadialGradient(x, y, 0, x, y, 1)
    c.save()
    c.translate(x, y)
    c.scale(rx, ry)
    const gg = c.createRadialGradient(0, 0, 0, 0, 0, 1)
    gg.addColorStop(0, col)
    gg.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = gg
    c.beginPath()
    c.arc(0, 0, 1, 0, Math.PI * 2)
    c.fill()
    c.restore()
    void rg
  }

  // key softbox (top-front)
  soft(360, 96, 300, 130, 'rgba(235,245,255,0.95)')
  soft(360, 60, 170, 70, 'rgba(255,255,255,1)')
  // rim blue left
  soft(90, 250, 220, 190, 'rgba(40,110,255,0.16)')
  // rim blue right
  soft(880, 240, 240, 200, 'rgba(30,90,235,0.15)')
  // warm floor bounce
  soft(560, 470, 420, 90, 'rgba(70,80,110,0.35)')

  const t = new THREE.CanvasTexture(cv)
  t.mapping = THREE.EquirectangularReflectionMapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ------------------------------ build ----------------------------- */

export interface BotParts {
  root: THREE.Group
  groups: Record<GroupKey, THREE.Group>
  screen: THREE.Mesh
  halo: THREE.Mesh
  glint: THREE.Mesh
  ringLightL: THREE.PointLight
  ringLightR: THREE.PointLight
  cable: THREE.Mesh
  materials: {
    body: THREE.MeshPhysicalMaterial
    gloss: THREE.MeshPhysicalMaterial
    screen: THREE.MeshBasicMaterial
    halo: THREE.MeshBasicMaterial
    glint: THREE.MeshBasicMaterial
  }
}

export function buildBot(faceTexture: THREE.Texture): BotParts {
  const root = new THREE.Group()

  const groups = {} as Record<GroupKey, THREE.Group>
  for (const k of Object.keys(EXPLODE) as GroupKey[]) {
    groups[k] = new THREE.Group()
    root.add(groups[k])
  }

  const body = new THREE.MeshPhysicalMaterial({
    color: 0x1b1e25,
    roughness: 0.46,
    metalness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.36,
    envMapIntensity: 0.75,
  })
  const bodyDark = new THREE.MeshPhysicalMaterial({
    color: 0x0b0d11,
    roughness: 0.6,
    metalness: 0.2,
    envMapIntensity: 0.7,
  })
  const gloss = new THREE.MeshPhysicalMaterial({
    color: 0x04050a,
    roughness: 0.06,
    metalness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.8,
  })
  const metal = new THREE.MeshStandardMaterial({
    color: 0x23272f,
    roughness: 0.34,
    metalness: 0.9,
    envMapIntensity: 1.1,
  })

  /* ---------------- shells ---------------- */
  const shellFrontGeo = prism(DIM.W, DIM.H, DIM.R, DIM.FRONT_Z0, DIM.FRONT_Z1, DIM.BEVEL)
  const shellFront = new THREE.Mesh(shellFrontGeo, body)
  groups.front.add(shellFront)

  const shellBackGeo = prism(DIM.W, DIM.H, DIM.R, DIM.BACK_Z0, DIM.BACK_Z1, DIM.BEVEL)
  const shellBack = new THREE.Mesh(shellBackGeo, body)
  groups.back.add(shellBack)

  // interior bay detail on the rear shell's open face
  const bayBack = new THREE.Mesh(
    prism(1.86, 1.74, 0.36, 0.1, 0.145, 0.01, 10),
    new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.85, metalness: 0.1 }),
  )
  groups.back.add(bayBack)
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x1a1e25, roughness: 0.5, metalness: 0.5 })
  for (let i = -1; i <= 1; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.06), ribMat)
    rib.position.set(0, i * 0.42, 0.16)
    groups.back.add(rib)
  }

  // display pocket on the front shell's face
  const pocket = new THREE.Mesh(
    prism(1.8, 1.7, 0.4, 0.892, 0.914, 0, 12),
    new THREE.MeshStandardMaterial({ color: 0x07080c, roughness: 0.9, metalness: 0.05 }),
  )
  groups.front.add(pocket)

  /* ---------------- glossy display module ---------------- */
  // NOTE: bevel*2 must stay below the prism span or the extrude self-intersects.
  const moduleMesh = new THREE.Mesh(prism(1.78, 1.68, 0.42, 0.84, 1.0, 0.035, 16), gloss)
  groups.display.add(moduleMesh)

  const screenMat = new THREE.MeshBasicMaterial({
    map: faceTexture,
    transparent: false,
    alphaTest: 0.45,
    toneMapped: false,
    color: 0xffffff,
  })
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 1.36, 1, 1), screenMat)
  screen.position.z = 1.006
  groups.display.add(screen)

  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    opacity: 0.9,
  })
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.9), haloMat)
  halo.position.z = 1.014
  halo.renderOrder = 4
  groups.display.add(halo)

  const glintMat = new THREE.MeshBasicMaterial({
    map: glintTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    opacity: 0,
  })
  const glint = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.4), glintMat)
  glint.position.z = 1.01
  glint.renderOrder = 5
  groups.display.add(glint)

  /* ---------------- side speakers ---------------- */
  const grilleMap = grilleTexture()
  const grilleMat = new THREE.MeshStandardMaterial({
    map: grilleMap,
    roughness: 0.65,
    metalness: 0.4,
    envMapIntensity: 0.8,
  })
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.95 })
  for (const side of [1, -1]) {
    for (const [half, target] of [
      [0, groups.front],
      [1, groups.back],
    ] as const) {
      // half = 0 -> forward half of the disc, 1 -> rear half
      const thetaStart = half === 0 ? Math.PI / 2 : -Math.PI / 2
      const recess = new THREE.Mesh(
        new THREE.CircleGeometry(0.4, 40, thetaStart, Math.PI),
        recessMat,
      )
      recess.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2
      recess.position.x = side * 1.046
      target.add(recess)

      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.375, 40, thetaStart, Math.PI),
        grilleMat,
      )
      disc.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2
      disc.position.x = side * 1.054
      target.add(disc)
    }
    // rim ring around the grille
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(0.378, 0.404, 48),
      new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.4, metalness: 0.8 }),
    )
    rim.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2
    rim.position.x = side * 1.056
    groups.back.add(rim)
  }

  /* ---------------- top button ---------------- */
  const btn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.03, 40),
    new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.4, metalness: 0.6 }),
  )
  btn.position.set(0, 1.0, 0.44)
  groups.front.add(btn)
  const btnRing = new THREE.Mesh(
    new THREE.RingGeometry(0.14, 0.155, 40),
    new THREE.MeshStandardMaterial({ color: 0x39424f, roughness: 0.3, metalness: 0.9 }),
  )
  btnRing.rotation.x = -Math.PI / 2
  btnRing.position.set(0, 1.017, 0.44)
  groups.front.add(btnRing)

  /* ---------------- rear ports ---------------- */
  const portMat = new THREE.MeshStandardMaterial({ color: 0x04050a, roughness: 0.8 })
  const usb = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.09), portMat)
  usb.position.set(0, -0.34, -0.902)
  usb.rotation.y = Math.PI
  groups.back.add(usb)
  const usbLip = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.14), metal)
  usbLip.position.set(0, -0.34, -0.9005)
  usbLip.rotation.y = Math.PI
  groups.back.add(usbLip)
  for (const s of [-1, 1]) {
    const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.05), portMat)
    vent.position.set(s * 0.3, -0.34, -0.902)
    vent.rotation.y = Math.PI
    groups.back.add(vent)
  }

  /* ---------------- feet ---------------- */
  const footGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.03, 24)
  const footMat = new THREE.MeshStandardMaterial({ color: 0x0a0b0e, roughness: 0.95 })
  for (const s of [-1, 1]) {
    const f1 = new THREE.Mesh(footGeo, footMat)
    f1.position.set(s * 0.62, -1.0, 0.44)
    groups.front.add(f1)
    const f2 = new THREE.Mesh(footGeo, footMat)
    f2.position.set(s * 0.62, -1.0, -0.44)
    groups.back.add(f2)
  }
  // bottom vent
  const bottomVent = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.28), grilleMat)
  bottomVent.rotation.x = -Math.PI / 2
  bottomVent.position.set(0, -1.002, -0.3)
  groups.back.add(bottomVent)

  /* ---------------- cable ---------------- */
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.34, -0.92),
    new THREE.Vector3(0.06, -0.58, -1.18),
    new THREE.Vector3(0.34, -0.86, -1.4),
    new THREE.Vector3(0.82, -0.99, -1.6),
    new THREE.Vector3(1.42, -1.02, -1.78),
  ])
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 60, 0.036, 10, false),
    new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.92, metalness: 0.05, envMapIntensity: 0.35 }),
  )
  groups.back.add(cable)

  /* ---------------- internals ---------------- */
  // structural chassis
  const chassis = new THREE.Mesh(prism(1.94, 1.84, 0.4, -0.03, 0.1, 0.03, 12), metal)
  groups.chassis.add(chassis)
  const chassisHole = new THREE.Mesh(prism(1.5, 1.4, 0.3, -0.05, 0.12, 0.02, 10), bodyDark)
  groups.chassis.add(chassisHole)

  // vision module
  const visionBody = new THREE.Mesh(prism(0.62, 0.3, 0.1, 0.2, 0.36, 0.04, 8), metal)
  visionBody.position.y = 0.44
  groups.vision.add(visionBody)
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.06, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x0a1830,
      roughness: 0.05,
      metalness: 0.4,
      clearcoat: 1,
      envMapIntensity: 2.2,
    }),
  )
  lens.rotation.x = Math.PI / 2
  lens.position.set(0, 0.44, 0.38)
  groups.vision.add(lens)
  const lensRing = new THREE.Mesh(
    new THREE.RingGeometry(0.088, 0.105, 32),
    new THREE.MeshStandardMaterial({ color: 0x3a4452, roughness: 0.3, metalness: 0.9 }),
  )
  lensRing.position.set(0, 0.44, 0.41)
  groups.vision.add(lensRing)

  // main board
  const pcb = new THREE.Mesh(
    prism(1.72, 1.6, 0.16, -0.17, -0.11, 0.01, 8),
    new THREE.MeshStandardMaterial({
      map: pcbTexture(),
      roughness: 0.55,
      metalness: 0.35,
      envMapIntensity: 0.9,
    }),
  )
  groups.pcb.add(pcb)
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x12141a, roughness: 0.35, metalness: 0.6 })
  const soic = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.07), chipMat)
  soic.position.set(-0.1, 0.1, -0.07)
  groups.pcb.add(soic)
  for (const [x, y, w, h] of [
    [0.44, 0.36, 0.26, 0.16],
    [0.42, -0.2, 0.3, 0.2],
    [-0.5, -0.36, 0.22, 0.28],
    [0.0, -0.5, 0.36, 0.14],
  ]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), chipMat)
    c.position.set(x, y, -0.075)
    groups.pcb.add(c)
  }
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b25c, roughness: 0.3, metalness: 0.9 })
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.02), gold)
    p.position.set(-0.7 + i * 0.1, 0.66, -0.1)
    groups.pcb.add(p)
  }

  // audio driver
  const speaker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.5, 0.2, 48),
    new THREE.MeshStandardMaterial({ color: 0x14171d, roughness: 0.45, metalness: 0.75 }),
  )
  speaker.rotation.x = Math.PI / 2
  speaker.position.z = -0.34
  groups.speaker.add(speaker)
  const cone = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.9, metalness: 0.1 }),
  )
  cone.position.z = -0.23
  groups.speaker.add(cone)
  const magnet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.14, 32),
    new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.3, metalness: 0.95 }),
  )
  magnet.rotation.x = Math.PI / 2
  magnet.position.z = -0.46
  groups.speaker.add(magnet)

  // power cell
  const battery = new THREE.Mesh(
    prism(1.5, 1.3, 0.24, -0.76, -0.5, 0.06, 10),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a1f2a,
      roughness: 0.35,
      metalness: 0.6,
      clearcoat: 0.4,
    }),
  )
  groups.battery.add(battery)
  const battStripe = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x2f6cff, toneMapped: false }),
  )
  battStripe.position.set(0, 0.2, -0.495)
  groups.battery.add(battStripe)

  /* ---------------- rim lights ---------------- */
  const ringLightL = new THREE.PointLight(0x4c9dff, 6, 7, 2)
  ringLightL.position.set(-1.4, 0.2, 1.5)
  const ringLightR = new THREE.PointLight(0x4c9dff, 6, 7, 2)
  ringLightR.position.set(1.4, 0.2, 1.5)
  root.add(ringLightL, ringLightR)

  return {
    root,
    groups,
    screen,
    halo,
    glint,
    ringLightL,
    ringLightR,
    cable,
    materials: { body, gloss, screen: screenMat, halo: haloMat, glint: glintMat },
  }
}
