import { useCallback, useEffect, useState } from 'react'
import './styles/global.css'
import BotCanvas from './components/BotCanvas'
import Nav from './components/Nav'
import Loader from './components/Loader'
import Onboarding from './components/Onboarding'
import { Cursor, Rail, useMagnetic } from './components/Cursor'
import Hero from './sections/Hero'
import Character from './sections/Character'
import { Hear, See, Think } from './sections/Senses'
import { Body, Display, Exploded } from './sections/Hardware'
import { Interact, Personality, Space } from './sections/Living'
import { Cta, Features, Final, Tech } from './sections/Closing'
import { initScroll } from './bot/scroll'
import { appState } from './bot/store'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function App() {
  const [ready, setReady] = useState(false)
  useMagnetic()

  /* ---- warm up: wait for fonts (bounded) so nothing jumps ---- */
  useEffect(() => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setReady(true)
    }
    const fonts = (document as any).fonts
    if (fonts?.ready) fonts.ready.then(finish).catch(finish)
    else finish()
    const t = window.setTimeout(finish, 1600)
    return () => clearTimeout(t)
  }, [])

  /* ---- wire scroll once the sections exist ---- */
  useEffect(() => {
    initScroll()
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    return () => {
      clearTimeout(t)
      window.removeEventListener('load', onLoad)
    }
  }, [])

  const boot = useCallback(() => {
    appState.booted = true
    window.dispatchEvent(new Event('zero:boot'))
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  return (
    <>
      <div className="bg" aria-hidden="true" />
      <BotCanvas />

      <main className="content">
        <Hero />
        <Character />
        <See />
        <Hear />
        <Think />
        <Body />
        <Display />
        <Exploded />
        <Interact />
        <Personality />
        <Space />
        <Features />
        <Tech />
        <Final />
        <Cta />
      </main>

      <Nav />
      <Rail />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <Loader ready={ready} onDone={boot} />
      <Onboarding />
    </>
  )
}
