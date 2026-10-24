export type Profile = { id: string; name: string; email: string; phone: string }

const KEY = 'zero-profile'

/** FIDO-ish visually unambiguous ID, e.g. ZB-7K3M9QX2 */
function makeId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return `ZB-${out}`
}

export function getProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (p && typeof p.id === 'string' && typeof p.name === 'string') return p as Profile
  } catch {
    /* corrupted storage — treat as first visit */
  }
  return null
}

export function saveProfile(input: { name: string; email: string; phone: string }): Profile {
  const existing = getProfile()
  const profile: Profile = {
    id: existing?.id || makeId(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    /* private mode — keep session-only */
  }
  window.dispatchEvent(new CustomEvent('zero:profile', { detail: profile }))
  return profile
}

export function onProfileChange(cb: (p: Profile | null) => void) {
  const h = (e: Event) => cb((e as CustomEvent<Profile>).detail)
  window.addEventListener('zero:profile', h)
  return () => window.removeEventListener('zero:profile', h)
}

/** WhatsApp deep link with the pre-filled pre-registration message. */
export function waLink(p: Profile | null) {
  const msg = p
    ? `Hi, my name is ${p.name}, my email is ${p.email}, and my mobile number is ${p.phone}, and I want to pre-register for Zero Bot V1`
    : 'Hi, I want to pre-register for Zero Bot V1'
  return `https://wa.me/917014270402?text=${encodeURIComponent(msg)}`
}

/* ---- settings modal bus: Nav's gear emits, Onboarding listens ---- */
export function openSettings() {
  window.dispatchEvent(new Event('zero:settings'))
}

export function onSettingsRequest(cb: () => void) {
  window.addEventListener('zero:settings', cb)
  return () => window.removeEventListener('zero:settings', cb)
}
