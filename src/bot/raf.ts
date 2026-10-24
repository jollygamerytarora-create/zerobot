/**
 * requestAnimationFrame is not guaranteed to fire: browsers suspend it when the
 * window is occluded, the tab is throttled, or the device is battery-constrained.
 * This loop keeps a heartbeat going so scroll-linked work never silently freezes.
 */
export function loop(cb: (dt: number, now: number) => void) {
  let rafId = 0
  let timer = 0
  let last = performance.now()
  let lastRaf = 0
  let stopped = false

  const step = () => {
    if (stopped) return
    const now = performance.now()
    const dt = (now - last) / 1000
    last = now
    cb(dt, now)
  }

  const frame = () => {
    if (stopped) return
    lastRaf = performance.now()
    step()
    rafId = requestAnimationFrame(frame)
  }

  rafId = requestAnimationFrame(frame)

  timer = window.setInterval(() => {
    if (stopped) return
    // only take over when rAF has clearly stalled
    if (performance.now() - lastRaf > 200) step()
  }, 33)

  return () => {
    stopped = true
    cancelAnimationFrame(rafId)
    window.clearInterval(timer)
  }
}

/** True when rAF has not produced a frame for a while. */
export function makeStallWatch(ms = 250) {
  let lastFrame = performance.now()
  return {
    mark() {
      lastFrame = performance.now()
    },
    stalled() {
      return performance.now() - lastFrame > ms
    },
  }
}
