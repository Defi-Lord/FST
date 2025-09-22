import { useState } from 'react'
import { AppProvider } from './state'

import Landing from './pages_Landing'
import Rewards from './pages_Rewards'
// import CreateTeam from './pages_CreateTeam' // no longer needed because createTeam renders ViewTeam
import ViewTeam from './pages_ViewTeam'
import JoinContest from './pages_JoinContest'
import Leaderboard from './pages_Leaderboard'
import HomeHub from './pages_HomeHub'

type Route =
  | 'landing'
  | 'rewards'
  | 'home'
  | 'createTeam'
  | 'viewTeam'
  | 'joinContest'
  | 'leaderboard'

export default function App(){
  const [route, setRoute] = useState<Route>('landing')
  const go = (r: Route) => () => setRoute(r)

  return (
    <AppProvider>
      {route === 'landing' && <Landing onLaunch={go('rewards')} />}

      {route === 'rewards' && <Rewards onClaim={go('home')} />}

      {route === 'home' && (
        <HomeHub
          onBack={go('landing')}
          onViewTeam={go('viewTeam')}
          onCreateTeam={go('viewTeam')}   // Create Team now opens View Team
          onJoinContest={go('joinContest')}
          onLeaderboard={go('leaderboard')}
          onTransfers={() => alert('Transfers coming soon')}
          onFixtures={() => alert('Fixtures coming soon')}
          onStats={() => alert('Stats coming soon')}
        />
      )}

      {/* Make the createTeam route render the same UI as viewTeam */}
      {route === 'createTeam' && <ViewTeam onBack={go('home')} />}

      {route === 'viewTeam' && <ViewTeam onBack={go('home')} />}

      {route === 'joinContest' && <JoinContest onSelect={go('leaderboard')} onBack={go('home')} />}

      {route === 'leaderboard' && <Leaderboard onNext={go('home')} onBack={go('home')} />}
    </AppProvider>
  )
}
