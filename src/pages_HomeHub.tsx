// src/pages_HomeHub.tsx
import { useEffect, useMemo, useState } from 'react'
import { useApp } from './state'
import TopBar from './components_TopBar'
import { fetchFixtures, fetchBootstrap } from './api' // ← use your Vercel API

type Props = {
  onViewTeam: () => void
  onCreateTeam: () => void
  onJoinContest: () => void
  onLeaderboard: () => void
  onTransfers?: () => void
  onFixtures?: () => void
  onStats?: () => void
  onBack?: () => void
}

type LbEntry = { name: string; points: number }

// simple leaderbord preview loader (unchanged)
async function loadLeaderboardPreview(timeoutMs = 7000): Promise<LbEntry[] | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort('timeout'), timeoutMs)
  try {
    const r = await fetch('/leaderboard.json', { cache: 'no-store', signal: ctrl.signal })
    if (!r.ok) return null
    const arr = await r.json()
    return Array.isArray(arr) ? arr.slice(0, 3) : null
  } catch { return null }
  finally { clearTimeout(timer) }
}

function formatLocal(dtIso: string) {
  try {
    const d = new Date(dtIso)
    return d.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return dtIso }
}

// shape we render after mapping FPL teams → names
type NextFixtureView = { home: string; away: string; kickoff_utc: string }

// pick the first upcoming fixture and map team IDs → names using bootstrap data
async function loadNextFixtureFromFPL(): Promise<NextFixtureView | null> {
  const [fixtures, bootstrap] = await Promise.all([
    fetchFixtures(),        // /api/fpl/fixtures?future=1
    fetchBootstrap()        // /api/fpl/bootstrap-static
  ])

  // map team ID → team name
  const teamNameById = new Map<number, string>()
  if (bootstrap?.teams) {
    for (const t of bootstrap.teams) teamNameById.set(t.id, t.name)
  }

  // choose earliest upcoming fixture that has a kickoff_time
  const upcoming = (fixtures || [])
    .filter((f: any) => !!f.kickoff_time)
    .sort((a: any, b: any) =>
      new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
    )[0]

  if (!upcoming) return null

  const home = teamNameById.get(upcoming.team_h) || `Team ${upcoming.team_h}`
  const away = teamNameById.get(upcoming.team_a) || `Team ${upcoming.team_a}`

  return { home, away, kickoff_utc: upcoming.kickoff_time }
}

export default function HomeHub({
  onViewTeam, onCreateTeam, onJoinContest, onLeaderboard,
  onTransfers, onFixtures, onStats, onBack
}: Props) {
  const { fullName, budget, team } = useApp()
  const picked = team.length
  const progressPct = useMemo(() => Math.min(100, Math.round((picked / 15) * 100)), [picked])

  const [lb, setLb] = useState<LbEntry[] | null | 'error'>(null)
  const [fixture, setFixture] = useState<NextFixtureView | null | 'error'>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [a, f] = await Promise.all([
        loadLeaderboardPreview().catch(() => 'error' as const),
        loadNextFixtureFromFPL().catch(() => 'error' as const)
      ])
      if (!mounted) return
      setLb(a === 'error' ? 'error' : a)
      setFixture(f === 'error' ? 'error' : f)
    })()
    return () => { mounted = false }
  }, [])

  const primaryAction = picked < 15
    ? { label: `Pick ${15 - picked} more`, onClick: onCreateTeam }
    : { label: 'View Team', onClick: onViewTeam }

  const clubsInFixture = useMemo(() => {
    if (!fixture || fixture === 'error') return { count: 0, clubs: [] as string[] }
    const clubs = new Set([fixture.home, fixture.away])
    const count = team.filter(p => clubs.has(p.club)).length
    return { count, clubs: Array.from(clubs) }
  }, [fixture, team])

  return (
    <div className="screen">
      <div className="container" style={{ paddingTop: 8, paddingBottom: 110 }}>
        <TopBar title="Home" onBack={onBack} rightSlot={<div className="balance-chip">£{budget.toFixed(1)}m</div>} />

        {/* Greeting */}
        <div style={{margin:'6px 0 10px'}}>
          <div style={{fontWeight:900,fontSize:20,letterSpacing:.2}}>Welcome</div>
          <div className="subtle">{fullName}</div>
        </div>

        {/* Squad status */}
        <div className="card" style={{marginBottom:14}}>
          <div className="row" style={{alignItems:'flex-start'}}>
            <div>
              <div style={{fontWeight:900, fontSize:18}}>Your Squad</div>
              <div className="subtle">{picked}/15 players selected</div>
              <div className="progress" style={{marginTop:10}}>
                <span style={{width: `${progressPct}%`}} />
              </div>
            </div>
            <button className="btn-ghost" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </button>
          </div>
          {picked > 0 && (
            <div className="mini-team">
              {team.slice(0,6).map(p => (
                <div key={p.id} className="mini-pill">
                  <span className="mini-dot" /> {p.name}
                </div>
              ))}
              {picked > 6 && <div className="mini-more">+{picked - 6} more</div>}
            </div>
          )}
        </div>

        {/* Next Fixture – now from real FPL via /api */}
        <div className="title-xl" style={{margin:'18px 0 8px'}}>Next Fixture</div>
        <div className="card">
          {fixture === null && <div className="subtle">Loading next match…</div>}
          {fixture === 'error' && <div className="subtle">Couldn’t load fixtures. Check your /api setup.</div>}
          {fixture && fixture !== 'error' && (
            <div className="row" style={{alignItems:'flex-start', gap:16}}>
              <div>
                <div style={{fontWeight:900, fontSize:18}}>{fixture.home} vs {fixture.away}</div>
                <div className="subtle">{formatLocal(fixture.kickoff_utc)}</div>
                {clubsInFixture.count > 0 && (
                  <div className="chip" style={{marginTop:10}}>
                    {clubsInFixture.count} of your player{clubsInFixture.count === 1 ? '' : 's'} will play
                  </div>
                )}
              </div>
              <button className="btn-ghost" onClick={onFixtures}>View fixtures</button>
            </div>
          )}
        </div>

        {/* Featured */}
        <div className="title-xl" style={{margin:'18px 0 12px'}}>Featured</div>
        <div className="hero">
          <div style={{fontSize:18,fontWeight:900,marginBottom:6}}>Premier League Weekly</div>
          <div className="subtle" style={{marginBottom:14}}>Set your XI and compete on the global leaderboard.</div>
          <div className="hero-tags">
            <span>Premier League</span><span>Weekly</span><span>Free to play</span>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="cta" onClick={onJoinContest}>Enter</button>
            <button className="btn-ghost" onClick={onLeaderboard}>Leaderboard</button>
          </div>
        </div>

        {/* Leaderboard preview */}
        <div className="title-xl" style={{margin:'18px 0 12px'}}>Leaderboard</div>
        <div className="list">
          {lb === null && <div className="card">Loading leaderboard…</div>}
          {lb === 'error' && <div className="card subtle">Couldn’t load leaderboard preview.</div>}
          {Array.isArray(lb) && lb.map((e, i) => (
            <div className="row card" key={i}>
              <div>
                <div style={{fontWeight:800}}>{e.name}</div>
                <div className="subtle">Points</div>
              </div>
              <div style={{fontWeight:800}}>{e.points}</div>
            </div>
          ))}
          <button className="btn-ghost" onClick={onLeaderboard}>See all</button>
        </div>

        {/* Finish squad banner */}
        {picked < 15 && (
          <div className="banner">
            <div>
              <div style={{fontWeight:900}}>Finish your squad</div>
              <div className="subtle">You need {15 - picked} more player{15 - picked === 1 ? '' : 's'} to enter contests.</div>
            </div>
            <button className="btn-add" onClick={onCreateTeam}>Complete Squad</button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="title-xl" style={{margin:'18px 0 12px'}}>Quick Actions</div>
        <div className="qa-grid">
          <button className="qa-card qa-green" onClick={onCreateTeam}>
            <div className="qa-icon">🏗️</div>
            <div className="qa-text">
              <div className="qa-title">Create Team</div>
              <div className="subtle">Pick your best XI</div>
            </div>
          </button>

          <button className="qa-card qa-blue" onClick={onTransfers}>
            <div className="qa-icon">🔁</div>
            <div className="qa-text">
              <div className="qa-title">Transfers</div>
              <div className="subtle">Swap players weekly</div>
            </div>
          </button>

          <button className="qa-card qa-purple" onClick={onFixtures}>
            <div className="qa-icon">📅</div>
            <div className="qa-text">
              <div className="qa-title">Fixtures</div>
              <div className="subtle">Upcoming matches</div>
            </div>
          </button>

          <button className="qa-card qa-orange" onClick={onStats}>
            <div className="qa-icon">📊</div>
            <div className="qa-text">
              <div className="qa-title">Stats</div>
              <div className="subtle">Form & xG</div>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="tabbar">
        <button className="tab active"><span>Home</span></button>
        <button className="tab" onClick={onJoinContest}><span>Leagues</span></button>
        <button className="tab" onClick={onLeaderboard}><span>Live</span></button>
        <button className="tab" onClick={onViewTeam}><span>Profile</span></button>
      </nav>
    </div>
  )
}
