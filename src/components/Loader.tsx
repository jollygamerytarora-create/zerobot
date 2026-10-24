import { useEffect, useState } from 'react'

export default function Loader({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState<'load' | 'eyes' | 'out'>('load')

  useEffect(() => {
    const start = performance.now()
    // timer-driven on purpose: rAF can be suspended while the page is hidden
    const id = window.setInterval(() => {
      const t = (performance.now() - start) / 1000
      if (t >= 1.3) {
        window.clearInterval(id)
        setPct(100)
        return
      }
      // Clamp below 100 until the final tick so pct changes exactly ONCE at the
      // end: overshooting 100 re-ran the transition effect below, whose cleanup
      // cancelled the pending phase timeouts and froze the loader at 100%.
      const target = Math.min(99, Math.round(Math.pow(t / 1.3, 0.72) * 99))
      setPct((p) => (target > p ? target : p))
    }, 60)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!ready || pct < 100) return
    // pct reaches 100 exactly once and never changes again, so this effect can
    // never be re-run into cancelling its own timeouts.
    const a = setTimeout(() => setPhase('eyes'), 180)
    const b = setTimeout(() => setPhase('out'), 760)
    const c = setTimeout(onDone, 1180)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
      clearTimeout(c)
    }
  }, [ready, pct, onDone])

  return (
    <div className={`loader ${phase === 'out' ? 'done' : ''}`} aria-hidden="true">
      <div className="loader-inner">
        <div className="loader-face">
          <div className="screen">
            <span className="eye" />
            <span className="eye" />
          </div>
        </div>
        <div className="loader-txt">
          {phase === 'load' ? 'INITIALIZING ZERO BOT...' : 'ZERO BOT ONLINE'}
        </div>
        {phase === 'load' ? (
          <>
            <div className="loader-ring" />
            <div className="loader-pct">{String(pct).padStart(3, '0')}%</div>
          </>
        ) : (
          <div className="loader-pct" style={{ letterSpacing: '0.5em' }}>
            V1
          </div>
        )}
      </div>
    </div>
  )
}
