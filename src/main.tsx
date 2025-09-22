// src/main.tsx
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './state'

import Landing from './pages_Landing'
import JoinContest from './pages_JoinContest'
import CreateTeam from './pages_CreateTeam'
import Leaderboard from './pages_Leaderboard'
import Rewards from './pages_Rewards'
import HomeHub from './pages_HomeHub'
import ViewTeam from './pages_ViewTeam'

type Route = 'landing' | 'contest' | 'create' | 'leaderboard' | 'rewards' | 'home' | 'viewteam'

function App() {
  const [route, setRoute] = useState<Route>('landing')
  const stackRef = useRef<Route[]>(['landing'])

  // helper: safe access to Telegram WebApp & version checks
  const getTG = () => (window as any)?.Telegram?.WebApp
  const supports = (min: string) => {
    try { return getTG()?.isVersionAtLeast?.(min) === true } catch { return false }
  }

  useEffect(() => {
    const tg = getTG()
    try {
      tg?.ready?.()
      tg?.expand?.()

      // Only call if supported on this Telegram version
      if (supports('6.1')) {
        tg.setHeaderColor?.('secondary_bg_color')
        tg.setBackgroundColor?.('#0b0c10')
      }
    } catch {}
  }, [])

  useEffect(() => {
    const tg = getTG()
    const showBack = !['landing','home'].includes(route)

    // Only wire the Telegram BackButton if the client supports it
    if (supports('6.1')) {
      try { showBack ? tg?.BackButton?.show?.() : tg?.BackButton?.hide?.() } catch {}
    }
  }, [route])

  useEffect(() => {
    const tg = getTG()
    // In Telegram >= 6.1: hook hardware BackButton to our stack
    if (!supports('6.1')) return

    const onBack = () => {
      const stack = stackRef.current
      if (stack.length > 1) {
        stack.pop()
        const prev = stack[stack.length - 1]
        setRoute(prev)
      }
    }
    try {
      tg?.BackButton?.onClick?.(onBack)
      return () => tg?.BackButton?.offClick?.(onBack)
    } catch { return }
  }, [])

  const go = (next: Route) => {
    const stack = stackRef.current
    stack.push(next)
    setRoute(next)
  }

  return (
    <>
      {route === 'landing'     && <Landing onLaunch={() => go('contest')} />}

      {route === 'contest'     && <JoinContest onSelect={() => go('create')} />}

      {route === 'create'      && <CreateTeam onNext={() => go('leaderboard')} />}

      {route === 'leaderboard' && <Leaderboard onNext={() => go('rewards')} />}

      {route === 'rewards'     && <Rewards onClaim={() => go('home')} />}

      {/* You can pass onBack to pages that render a TopBar with its own back button,
          so users on Telegram 6.0 (no native BackButton) can still navigate back. */}
      {route === 'home'        && <HomeHub onViewTeam={() => go('viewteam')} />}

      {route === 'viewteam'    && <ViewTeam onBack={() => {
        const stack = stackRef.current
        if (stack.length > 1) {
          stack.pop()
          setRoute(stack[stack.length - 1])
        } else {
          setRoute('home')
        }
      }} />}
    </>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)
