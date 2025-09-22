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

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp
    try {
      tg?.ready?.()
      tg?.expand?.()
      tg?.setHeaderColor?.('secondary_bg_color')
      tg?.setBackgroundColor?.('#0b0c10')

      const onBack = () => {
        const stack = stackRef.current
        if (stack.length > 1) {
          stack.pop()
          const prev = stack[stack.length - 1]
          setRoute(prev)
        }
      }
      tg?.BackButton?.onClick?.(onBack)
      return () => tg?.BackButton?.offClick?.(onBack)
    } catch {}
  }, [])

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp
    const showBack = !['landing','home'].includes(route)
    try { showBack ? tg?.BackButton?.show?.() : tg?.BackButton?.hide?.() } catch {}
  }, [route])

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
      {route === 'home'        && <HomeHub onViewTeam={() => go('viewteam')} />}
      {route === 'viewteam'    && <ViewTeam />}
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
