import { ANCHORS, labelEls } from '../bot/labels'

/**
 * Labels are positioned every frame by the render loop (projected from 3D
 * anchors), so React only owns the markup — no state, no re-renders.
 * The inline ref is set on mount and cleared on unmount by React itself.
 */
export default function PartLabels({ section }: { section: 'body' | 'exploded' }) {
  const items = ANCHORS.filter((a) => a.section === section)

  return (
    <>
      {items.map((a) => (
        <div
          key={a.id}
          className="plabel"
          ref={(el) => {
            labelEls[a.id] = el
          }}
        >
          {a.text}
        </div>
      ))}
    </>
  )
}
