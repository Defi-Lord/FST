import { useEffect, useMemo, useState } from 'react'
import { SAMPLE_PLAYERS, useApp, type Player } from './state'
import { loadPlayers } from './players_loader'
import TopBar from './components_TopBar'

export default function CreateTeam({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { budget, team, addPlayer, removePlayer, setBudget } = useApp()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (budget <= 0) setBudget(100.0) }, [budget, setBudget])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const external = await loadPlayers()
        if (!mounted) return
        if (external && external.length >= 50) {
          setPlayers(external)
        } else {
          setPlayers(SAMPLE_PLAYERS)
          setError('Showing fallback list — real FPL fetch failed. Check your proxy/relay.')
        }
      } catch {
        if (mounted) {
          setPlayers(SAMPLE_PLAYERS)
          setError('Showing fallback list — unexpected error loading FPL.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const canContinue = team.length === 15

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return players
    return players.filter(p => p.name.toLowerCase().includes(q))
  }, [players, query])

  const content = useMemo(() => {
    if (loading) return <div className="card">Loading players…</div>
    if (!filtered.length) {
      return (
        <div className="card">
          <div style={{fontWeight:800, marginBottom:6}}>No results</div>
          <div className="subtle">Try a different player name.</div>
        </div>
      )
    }
    return filtered.map((p) => {
      const inTeam = team.some(t => t.id === p.id)
      return (
        <div className="card" key={p.id}>
          <div className="row">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="avatar" />
              <div>
                <div style={{ fontWeight: 800 }}>{p.name}</div>
                <div className="subtle">{p.position} • {p.club}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="price">£{p.price.toFixed(1)}m</div>
              {inTeam ? (
                <button className="btn-remove" onClick={() => removePlayer(p.id)}>Remove</button>
              ) : (
                <button className="btn-add" onClick={() => {
                  const err = addPlayer(p)
                  if (err) alert(err)
                }}>Add</button>
              )}
            </div>
          </div>
        </div>
      )
    })
  }, [loading, filtered, team, addPlayer, removePlayer])

  return (
    <div className="screen">
      <div className="bg bg-field" /><div className="scrim" />
      <div className="container" style={{ paddingBottom: 110 }}>
        <TopBar title="Create Your Team" onBack={onBack} />
        <div className="meta-row">
          <div className="chip">Budget: <strong>£{budget.toFixed(1)}m</strong></div>
          <div className="chip">Selected: <strong>{team.length}/15</strong></div>
          <div className="chip">Available: <strong>{players.length}</strong></div>
        </div>
        {error && (
          <div className="card" style={{borderColor:'rgba(255,80,80,.5)'}}>
            <div style={{fontWeight:800, marginBottom:6}}>Couldn’t load real FPL players</div>
            <div className="subtle">{error}</div>
          </div>
        )}
        <div className="search-row">
          <input className="input" type="search" placeholder="Search players by name…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="list">{content}</div>

        <div className="bottom-actions">
          <button className="cta" style={{ width: '100%' }} disabled={!canContinue} onClick={onNext}>
            {canContinue ? 'Continue' : 'Pick 15 players to continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
