import { useState } from 'react'
import CreateTeam from './pages_CreateTeam'

type Route = 'home' | 'createTeam'

export default function App() {
  const [route, setRoute] = useState<Route>('home')

  const go = (r: Route) => () => setRoute(r)

  return (
    <div style={{ minHeight: '100dvh' }}>
      {route === 'home' && (
        <div style={{ padding: 24 }}>
          <h1 style={{ marginTop: 0 }}>FST</h1>
          <p>Welcome! Build your fantasy squad with a £100m budget.</p>
          <button onClick={go('createTeam')}>Create Team</button>
        </div>
      )}

      {route === 'createTeam' && (
        <CreateTeam
          onNext={go('home')}
          onBack={go('home')}
        />
      )}
    </div>
  )
}
