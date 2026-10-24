import { useEffect, useState, type FormEvent } from 'react'
import { getProfile, onSettingsRequest, saveProfile, type Profile } from '../bot/profile'
import { appState } from '../bot/store'
import { getLenis } from '../bot/scroll'
import { sfx } from '../bot/audio'

type Mode = 'hidden' | 'create' | 'saved' | 'edit'

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
const phoneOk = (v: string) => v.replace(/[^\d]/g, '').length >= 7 && v.replace(/[^\d]/g, '').length <= 15

export default function Onboarding() {
  const [mode, setMode] = useState<Mode>('hidden')
  const [profile, setProfile] = useState<Profile | null>(getProfile())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')

  /* first visit: open the create flow once the loader hands over */
  useEffect(() => {
    let timer = 0
    const openCreate = () => {
      if (getProfile()) return
      const p = getProfile()
      if (p) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setMode('create'), 700)
    }
    if (appState.booted) openCreate()
    window.addEventListener('zero:boot', openCreate)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('zero:boot', openCreate)
    }
  }, [])

  /* settings gear: edit when a profile exists, create otherwise */
  useEffect(() =>
    onSettingsRequest(() => {
      const p = getProfile()
      setProfile(p)
      setName(p?.name || '')
      setEmail(p?.email || '')
      setPhone(p?.phone || '')
      setErr('')
      setMode(p ? 'edit' : 'create')
    }),
  [])

  /* lock the page while the dialog is up */
  useEffect(() => {
    const open = mode !== 'hidden'
    const l = getLenis()
    if (open) {
      l?.stop()
      document.documentElement.classList.add('modal-open')
    } else {
      l?.start()
      document.documentElement.classList.remove('modal-open')
    }
    return () => {
      l?.start()
      document.documentElement.classList.remove('modal-open')
    }
  }, [mode])

  const close = () => {
    sfx.click()
    setMode('hidden')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return setErr('Please enter your name.')
    if (!emailOk(email)) return setErr('Please enter a valid email address.')
    if (!phoneOk(phone)) return setErr('Please enter a valid phone number.')
    setErr('')
    const p = saveProfile({ name, email, phone })
    setProfile(p)
    sfx.click()
    setMode(mode === 'edit' ? 'hidden' : 'saved')
  }

  if (mode === 'hidden') return null

  return (
    <div className="ob" role="dialog" aria-modal="true" aria-label="Your Zero profile">
      <div className="ob-card">
        <div className="ob-brand">
          <span className="brand-mark">ZERO</span>
          <span className="brand-sub">BOT V1</span>
        </div>

        {mode === 'saved' && profile ? (
          <>
            <p className="ob-eyebrow">ID CREATED</p>
            <div className="ob-id-big">{profile.id}</div>
            <p className="ob-lead">
              Your Zero ID is ready{profile.name ? `, ${profile.name.split(' ')[0]}` : ''}. You can
              update your details any time from <strong>Settings</strong> in the top bar.
            </p>
            <div className="ob-actions">
              <button className="btn btn-primary" onClick={close} data-hot>
                <span className="dot" />
                Start the experience
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <p className="ob-eyebrow">{mode === 'create' ? 'One-time setup' : 'Your profile'}</p>
            <h3>{mode === 'create' ? 'CREATE YOUR ZERO ID' : 'CHANGE SETTINGS'}</h3>
            <p className="ob-lead">
              {mode === 'create'
                ? 'Enter your details once — we will create your Zero ID and use it to pre-register you for Zero Bot V1.'
                : 'Update the details tied to your Zero ID.'}
            </p>
            {mode === 'edit' && profile ? <div className="ob-id">ID · {profile.id}</div> : null}

            <label className="ob-label" htmlFor="ob-name">
              Name
            </label>
            <input
              id="ob-name"
              className="ob-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              maxLength={60}
            />

            <label className="ob-label" htmlFor="ob-email">
              Email
            </label>
            <input
              id="ob-email"
              className="ob-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              maxLength={90}
            />

            <label className="ob-label" htmlFor="ob-phone">
              Phone number
            </label>
            <input
              id="ob-phone"
              className="ob-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
            />

            <div className="ob-err">{err}</div>
            <div className="ob-actions">
              <button className="btn btn-primary" type="submit" data-hot>
                <span className="dot" />
                {mode === 'create' ? 'Create my ID' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
