import * as THREE from 'three'
import type { GroupKey } from './parts'

export interface Anchor {
  id: string
  text: string
  section: 'body' | 'exploded'
  group: GroupKey
  local: [number, number, number]
  /** direction the label must face to be shown (dot with camera > 0) */
  dir?: [number, number, number]
  always?: boolean
  /** screen-space offset in px once projected */
  off: [number, number]
}

export const ANCHORS: Anchor[] = [
  // ---- 360° hardware tour ----
  { id: 'b-display', text: 'CURVED DISPLAY', section: 'body', group: 'display', local: [0, 0.75, 1.0], dir: [0, 0, 1], off: [206, -92] },
  { id: 'b-speaker', text: 'FULL-RANGE SPEAKER', section: 'body', group: 'root', local: [1.07, 0, 0.04], dir: [1, 0.1, 0], off: [206, 10] },
  { id: 'b-body', text: 'COMPACT BODY', section: 'body', group: 'back', local: [-0.2, 0.5, -0.93], dir: [0, 0, -1], off: [-196, -68] },
  { id: 'b-usb', text: 'USB-C', section: 'body', group: 'back', local: [0.42, -0.34, -0.93], dir: [0, 0, -1], off: [196, 54] },
  { id: 'b-360', text: '360° AUDIO', section: 'body', group: 'root', local: [-1.07, 0, 0.04], dir: [-1, 0.1, 0], off: [-206, 10] },

  // ---- exploded engineering reveal ----
  { id: 'e-display', text: 'DISPLAY', section: 'exploded', group: 'display', local: [0, 0.7, 1.0], always: true, off: [0, -132] },
  { id: 'e-processing', text: 'PROCESSING', section: 'exploded', group: 'pcb', local: [0.7, 0.5, -0.14], always: true, off: [186, -66] },
  { id: 'e-audio', text: 'AUDIO', section: 'exploded', group: 'speaker', local: [0.4, 0.4, -0.34], always: true, off: [186, 62] },
  { id: 'e-vision', text: 'VISION', section: 'exploded', group: 'vision', local: [0.3, 0.6, 0.3], always: true, off: [-178, -62] },
  { id: 'e-power', text: 'POWER', section: 'exploded', group: 'battery', local: [-0.6, 0.5, -0.62], always: true, off: [-186, 60] },
]

/** DOM nodes registered by <PartLabels/>, written to directly by the render loop. */
export const labelEls: Record<string, HTMLElement | null> = {}
