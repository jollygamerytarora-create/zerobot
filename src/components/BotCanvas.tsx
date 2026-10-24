import { useEffect, useRef } from 'react'
import { ZeroScene } from '../bot/scene'
import { pointer } from '../bot/store'

export default function BotCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    let scene: ZeroScene | null = null
    try {
      scene = new ZeroScene(canvas)
    } catch (err) {
      console.warn('[zero-bot] WebGL unavailable, falling back to 2D', err)
      document.documentElement.classList.add('no-webgl')
    }

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ny = (e.clientY / window.innerHeight) * 2 - 1
      pointer.active = true
    }
    const onLeave = () => {
      pointer.nx = 0
      pointer.ny = 0
      pointer.active = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      scene?.dispose()
    }
  }, [])

  return <canvas id="bot-canvas" ref={ref} aria-hidden="true" />
}
