import * as THREE from 'three'
import { Face } from './face'
import {
  buildBot,
  dotTexture,
  environmentTexture,
  EXPLODE,
  type BotParts,
  type GroupKey,
} from './parts'
import { ANCHORS, labelEls } from './labels'
import { C, T, faceState, lookBias, pointer, quality, scroll } from './store'
import { loop } from './raf'

const damp = (cur: number, tgt: number, rate: number, dt: number) =>
  cur + (tgt - cur) * (1 - Math.exp(-rate * dt))

export class ZeroScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private parts: BotParts
  private face: Face
  private canvas: HTMLCanvasElement
  private w = 1
  private h = 1
  private stopLoop: (() => void) | null = null
  private glow: THREE.Mesh
  private pool: THREE.Mesh
  private points: THREE.Points
  private pData: { a: number; r: number; y: number; s: number; b: number }[] = []
  private streams: THREE.Group
  private tmp = new THREE.Vector3()
  private tmp2 = new THREE.Vector3()
  private look = { x: 0, y: 0 }
  private camOff = { x: 0, y: 0 }
  private t = 0
  private frames = 0
  private slowFrames = 0
  private lights: [THREE.Light, number][] = []
  disposed = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !quality.mobile,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    })
    this.renderer.setClearAlpha(0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.06
    this.renderer.setPixelRatio(quality.dpr)

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120)
    this.camera.position.set(0, 0, C.camZ)

    // environment for premium reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const eq = environmentTexture()
    const env = pmrem.fromEquirectangular(eq).texture
    this.scene.environment = env
    eq.dispose()
    pmrem.dispose()

    /* ---------------- lights ---------------- */
    const key = new THREE.DirectionalLight(0xdfeaff, 3.1)
    key.position.set(3.2, 4.4, 5.5)
    const fill = new THREE.DirectionalLight(0x8fb6ff, 0.9)
    fill.position.set(-4, -1.2, 3)
    const rim = new THREE.DirectionalLight(0x4f92ff, 3.0)
    rim.position.set(-3.4, 1.6, -4.2)
    const rim2 = new THREE.DirectionalLight(0x3f7bff, 1.9)
    rim2.position.set(3.6, 0.6, -3.8)
    const amb = new THREE.AmbientLight(0x1d2740, 1.15)
    this.lights = [
      [key, key.intensity],
      [fill, fill.intensity],
      [rim, rim.intensity],
      [rim2, rim2.intensity],
      [amb, amb.intensity],
    ] as [THREE.Light, number][]
    this.scene.add(key, fill, rim, rim2, amb)

    /* ---------------- bot ---------------- */
    this.face = new Face(quality.mobile ? 640 : 900)
    this.parts = buildBot(this.face.texture)
    this.scene.add(this.parts.root)

    /* ---------------- atmosphere ---------------- */
    this.glow = this.makeGlow(7.2, 'rgba(46,116,255,0.55)', 'rgba(20,50,140,0)')
    this.glow.position.set(0, 0.1, -2.6)
    this.scene.add(this.glow)

    this.pool = this.makeGlow(5.2, 'rgba(70,140,255,0.4)', 'rgba(10,20,50,0)')
    this.pool.rotation.x = -Math.PI / 2
    this.pool.position.set(0, -1.28, 0.4)
    this.scene.add(this.pool)

    this.points = this.makeParticles()
    this.scene.add(this.points)

    this.streams = this.makeStreams()
    this.scene.add(this.streams)

    this.resize()
    window.addEventListener('resize', this.resize)
    this.stopLoop = loop((dt) => this.frame(dt))

    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__zero = { scene: this, T, C, scroll, quality }
    }
  }

  /** Debug helper: projected screen AABB of the assembled product (CSS px). */
  bounds() {
    this.parts.root.updateMatrixWorld(true)
    const corners: number[] = []
    for (const x of [-1.05, 1.05])
      for (const y of [-0.99, 0.99]) for (const z of [-0.9, 1.05]) corners.push(x, y, z)
    let minX = 1e9
    let minY = 1e9
    let maxX = -1e9
    let maxY = -1e9
    const v = new THREE.Vector3()
    for (let i = 0; i < corners.length; i += 3) {
      v.set(corners[i], corners[i + 1], corners[i + 2])
      this.parts.root.localToWorld(v)
      v.project(this.camera)
      const sx = (v.x * 0.5 + 0.5) * this.w
      const sy = (-v.y * 0.5 + 0.5) * this.h
      minX = Math.min(minX, sx)
      maxX = Math.max(maxX, sx)
      minY = Math.min(minY, sy)
      maxY = Math.max(maxY, sy)
    }
    return {
      minX: Math.round(minX),
      minY: Math.round(minY),
      maxX: Math.round(maxX),
      maxY: Math.round(maxY),
    }
  }

  /** Debug helper: where the product's origin lands on screen (CSS px). */
  probe() {
    const v = new THREE.Vector3(0, 0, 0)
    this.parts.root.updateMatrixWorld(true)
    this.parts.root.localToWorld(v)
    const p = v.clone().project(this.camera)
    return {
      sx: +((p.x * 0.5 + 0.5) * this.w).toFixed(1),
      sy: +((-p.y * 0.5 + 0.5) * this.h).toFixed(1),
      cam: [this.camera.position.x, this.camera.position.y, this.camera.position.z].map((n) => +n.toFixed(2)),
      root: [this.parts.root.position.x, this.parts.root.position.y, this.parts.root.position.z].map((n) => +n.toFixed(2)),
      scale: +this.parts.root.scale.x.toFixed(3),
      C: JSON.parse(JSON.stringify(C)),
      T: JSON.parse(JSON.stringify(T)),
    }
  }

  /* ------------------------- construction ------------------------- */

  private makeGlow(size: number, inner: string, outer: string) {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 256
    const c = cv.getContext('2d')!
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, inner)
    g.addColorStop(0.45, inner.replace(/[\d.]+\)$/, '0.18)'))
    g.addColorStop(1, outer)
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
    const tex = new THREE.CanvasTexture(cv)
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
      }),
    )
    m.renderOrder = -1
    return m
  }

  private makeParticles() {
    const count = quality.mobile ? 240 : 720
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    this.pData = []
    for (let i = 0; i < count; i++) {
      const d = {
        a: Math.random() * Math.PI * 2,
        r: 2.4 + Math.random() * 5.4,
        y: (Math.random() - 0.5) * 5.4,
        s: 0.12 + Math.random() * 0.5,
        b: 0.25 + Math.random() * 0.75,
      }
      this.pData.push(d)
      pos[i * 3] = Math.cos(d.a) * d.r
      pos[i * 3 + 1] = d.y
      pos[i * 3 + 2] = Math.sin(d.a) * d.r
      col[i * 3] = 0.45 * d.b
      col[i * 3 + 1] = 0.7 * d.b
      col[i * 3 + 2] = 1 * d.b
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({
      size: quality.mobile ? 0.055 : 0.042,
      map: dotTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
      opacity: 0,
    })
    const p = new THREE.Points(geo, mat)
    p.frustumCulled = false
    return p
  }

  private makeStreams() {
    const g = new THREE.Group()
    const mat = new THREE.MeshBasicMaterial({
      color: 0x3d7fe0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    for (let i = 0; i < 6; i++) {
      const pts: THREE.Vector3[] = []
      const phase = (i / 6) * Math.PI * 2
      const rad = 1.75 + (i % 3) * 0.5
      const tilt = (i / 7 - 0.5) * 1.5
      for (let s = 0; s <= 46; s++) {
        const u = s / 46
        const a = phase + u * Math.PI * 2.2
        pts.push(
          new THREE.Vector3(
            Math.cos(a) * rad * (1 - u * 0.25),
            Math.sin(u * Math.PI) * tilt * 1.6 + (u - 0.5) * 0.9,
            Math.sin(a) * rad * (1 - u * 0.25),
          ),
        )
      }
      const curve = new THREE.CatmullRomCurve3(pts)
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.005, 5, false), mat)
      g.add(tube)
    }
    g.userData.mat = mat
    return g
  }

  /* ---------------------------- api ------------------------------- */

  resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    if (w === this.w && h === this.h) return
    this.w = w
    this.h = h
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // keep the product framed on narrow viewports
    this.camera.fov = w / h < 0.85 ? 40 : 32
    this.camera.updateProjectionMatrix()
  }

  dispose() {
    this.disposed = true
    this.stopLoop?.()
    window.removeEventListener('resize', this.resize)
    this.renderer.dispose()
  }

  /* ---------------------------- loop ------------------------------ */

  private frame = (rawDt: number) => {
    if (this.disposed) return
    const dt = Math.min(rawDt, 0.05)
    this.t += dt
    const t = this.t

    /* --- adaptive quality --- */
    this.frames++
    if (dt > 0.034) this.slowFrames++
    if (this.frames === 180) {
      if (this.slowFrames > 70 && this.renderer.getPixelRatio() > 1) {
        this.renderer.setPixelRatio(1)
      }
      this.frames = 0
      this.slowFrames = 0
    }

    /* --- state damping: this is where the weight comes from --- */
    const kPos = quality.reduced ? 30 : 7.5
    const kRot = quality.reduced ? 30 : 5.2
    C.x = damp(C.x, T.x, kPos, dt)
    C.y = damp(C.y, T.y, kPos, dt)
    C.z = damp(C.z, T.z, kPos, dt)
    C.rx = damp(C.rx, T.rx, kRot, dt)
    C.ry = damp(C.ry, T.ry, kRot, dt)
    C.rz = damp(C.rz, T.rz, 6.5, dt)
    C.scale = damp(C.scale, T.scale, kPos, dt)
    C.rim = damp(C.rim, T.rim, 5, dt)
    C.screen = damp(C.screen, T.screen, 6, dt)
    C.explode = damp(C.explode, T.explode, quality.reduced ? 30 : 6.5, dt)
    C.glow = damp(C.glow, T.glow, 4.5, dt)
    C.particles = damp(C.particles, T.particles, 4, dt)
    C.flow = damp(C.flow, T.flow, 3.5, dt)
    C.camZ = damp(C.camZ, T.camZ, 5.5, dt)
    C.dim = damp(C.dim, T.dim, quality.reduced ? 40 : 7, dt)

    /* --- scroll momentum feeds a subtle roll --- */
    scroll.smooth = damp(scroll.smooth, scroll.velocity, 6, dt)

    const idle = quality.reduced ? 0 : 1
    const bob = Math.sin(t * 0.9) * 0.045 * idle
    const sway = Math.sin(t * 0.42) * 0.035 * idle

    const root = this.parts.root
    root.position.set(C.x, C.y + bob, C.z)
    root.rotation.set(
      C.rx + sway * 0.35,
      C.ry + sway * 0.5,
      C.rz + scroll.smooth * 0.00016 * idle,
    )
    root.scale.setScalar(C.scale)

    /* --- camera parallax --- */
    const pk = 1 - Math.exp(-dt * 3.2)
    this.camOff.x = damp(this.camOff.x, pointer.nx * 0.34, 3.2, dt)
    this.camOff.y = damp(this.camOff.y, -pointer.ny * 0.22, 3.2, dt)
    void pk
    this.camera.position.set(this.camOff.x, this.camOff.y, C.camZ)
    this.camera.lookAt(this.camOff.x * 0.35, this.camOff.y * 0.3, 0)

    /* --- eyes: live cursor + choreography bias --- */
    const wantX = THREE.MathUtils.clamp(lookBias.x + pointer.nx * 0.85, -1, 1)
    const wantY = THREE.MathUtils.clamp(lookBias.y + pointer.ny * 0.7, -1, 1)
    this.look.x = damp(this.look.x, wantX, 7, dt)
    this.look.y = damp(this.look.y, wantY, 7, dt)
    faceState.lookX = this.look.x
    faceState.lookY = this.look.y
    this.face.setExpression(faceState.expr)
    this.face.update(dt, t)

    /* --- screen / rim --- */
    const power = faceState.power
    const dim = C.dim
    for (const [l, base] of this.lights) l.intensity = base * dim
    this.parts.root.visible = dim > 0.015
    this.parts.materials.screen.color.setScalar(0.15 + 0.85 * C.screen * power * dim)
    this.parts.materials.halo.opacity = (0.25 + 0.75 * C.rim) * power * dim
    const li = (0.5 + 2.4 * C.rim) * power * dim
    this.parts.ringLightL.intensity = li * 5
    this.parts.ringLightR.intensity = li * 5

    /* --- glass glint follows rotation --- */
    const glintAmt =
      Math.max(0, Math.sin(C.ry * 1.6 + 0.4)) * 0.16 + Math.max(0, Math.sin(C.rx * 2)) * 0.06
    this.parts.materials.glint.opacity = glintAmt * power

    /* --- explode --- */
    const e = C.explode
    for (const k of Object.keys(EXPLODE) as GroupKey[]) {
      const [ox, oy, oz] = EXPLODE[k]
      const g = this.parts.groups[k]
      g.position.set(ox * e, oy * e, oz * e)
      if (k !== 'root') {
        g.rotation.y = e * (k === 'display' ? -0.06 : k === 'back' ? 0.05 : 0)
      }
    }
    this.parts.cable.visible = e < 0.04
    this.parts.groups.front.visible = true

    /* --- atmosphere --- */
    const gm = this.glow.material as THREE.MeshBasicMaterial
    gm.opacity = (0.35 + 0.65 * C.glow) * power * dim
    this.glow.scale.setScalar(1 + C.glow * 0.22)
    this.pool.material = this.glow.material
    ;(this.pool as THREE.Mesh).visible = C.glow > 0.12 && e < 0.4

    const pm = this.points.material as THREE.PointsMaterial
    pm.opacity = C.particles * power * dim
    if (C.particles > 0.01 && dim > 0.02) {
      const pos = this.points.geometry.attributes.position as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      const flow = 0.18 + C.flow * 1.5
      for (let i = 0; i < this.pData.length; i++) {
        const d = this.pData[i]
        d.a += dt * d.s * (0.25 + C.flow * 0.9)
        d.r -= dt * d.s * flow
        d.y -= dt * d.s * flow * 0.22
        if (d.r < 1.35 || d.y < -2.9) {
          d.r = 4.6 + Math.random() * 3.6
          d.y = 1.6 + Math.random() * 2.6
          d.a = Math.random() * Math.PI * 2
        }
        arr[i * 3] = Math.cos(d.a) * d.r
        arr[i * 3 + 1] = d.y
        arr[i * 3 + 2] = Math.sin(d.a) * d.r
      }
      pos.needsUpdate = true
    }

    const sm = this.streams.userData.mat as THREE.MeshBasicMaterial
    sm.opacity = Math.max(0, C.flow - 0.12) * 0.55 * power * dim
    this.streams.rotation.y += dt * (0.1 + C.flow * 0.45)
    this.streams.rotation.x = Math.sin(t * 0.2) * 0.14

    this.updateLabels()

    this.renderer.render(this.scene, this.camera)
  }

  /* --------------------------- labels ----------------------------- */

  private updateLabels() {
    const section = scroll.section
    const active = section === 'body' || section === 'exploded'
    if (!active) {
      for (const a of ANCHORS) {
        const el = labelEls[a.id]
        if (el && el.style.opacity !== '0') el.style.opacity = '0'
      }
      return
    }
    this.parts.root.updateMatrixWorld(true)
    for (const a of ANCHORS) {
      const el = labelEls[a.id]
      if (!el) continue
      if (a.section !== section) {
        if (el.style.opacity !== '0') el.style.opacity = '0'
        continue
      }
      const g = this.parts.groups[a.group]
      this.tmp.set(a.local[0], a.local[1], a.local[2])
      g.localToWorld(this.tmp)

      let vis = true
      if (a.dir && !a.always) {
        this.tmp2.set(a.dir[0], a.dir[1], a.dir[2]).transformDirection(g.matrixWorld)
        const toCam = this.camera.position.clone().sub(this.tmp).normalize()
        vis = this.tmp2.dot(toCam) > 0.06
      }
      if (section === 'exploded') vis = vis && C.explode > 0.45
      if (section === 'body') vis = vis && C.explode < 0.2

      if (!vis) {
        if (el.style.opacity !== '0') el.style.opacity = '0'
        continue
      }
      this.tmp.project(this.camera)
      const x = (this.tmp.x * 0.5 + 0.5) * this.w + a.off[0]
      const y = (-this.tmp.y * 0.5 + 0.5) * this.h + a.off[1]
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`
      el.style.opacity = '1'
    }
  }
}
