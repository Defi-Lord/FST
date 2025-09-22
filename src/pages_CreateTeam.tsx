// src/pages_CreateTeam.tsx
import { useEffect, useMemo, useState } from 'react'
import { useApp, type Player, Position } from './state'
import TopBar from './components_TopBar'
import { fetchBootstrap } from './api'

type FplElement = {
  id: number
  web_name: string
  team: number
  now_cost: number
  element_type: number
  form: string
}

type FplTeam = { id: number; name: string }

function mapTypeToPosition(t: number): Position {
  // 1=GK, 2=DEF, 3=MID, 4=FWD (FPL convention)
  return (['', 'GK','DEF','MID','FWD'] as any)[t] as Position
}

export default function CreateTeam({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  const { team, addPlayer, removePlayer, budget } = useApp()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pool, setPool] = useState<Player[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchBootstrap() // ← calls /api/fpl/bootstrap-static
        const teams: FplTeam[] = data?.teams || []
        const elements: FplElement[] = data?.elements || []

        const teamNameById = new Map(teams.map(t => [t.id, t.name]))
        const mapped: Player[] = elements.slice(0, 200).map(e => ({
          id: String(e.id),
          name: e.web_name,
          club: teamNameById.get(e.team) || `Team ${e.team}`,
          position: mapTypeToPosition(e.element_type),
          price: Number((e.now_cost || 0) / 10),
          form: Number(parseFloat(e.form || '0')),
        }))
        if (!mounted) return
        setPool(mapped)
      } catch (e: any) {
        if (!mounted) return
        setError('Couldn’t load real FPL players. Showing fallback list — real FPL fetch failed. Check your /api setup.')

        // fetch fallback from /public
        try {
          const r = await fetch('/fallback-players.json', { cache: 'no-store' })
          const arr = await r.json()
          const mapped: Player[] = (arr as any[]).map(p => ({
            id: String(p.id),
            name: p.name,
            club: p.club,
            position: p.position as Position,
            price: Number(p.price),
            form: Number(p.form),
          }))
          setPool(mapped)
        } catch {
          // if even fallback fails, just leave pool empty
          setPool([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const pickedIds = useMemo(() => new Set(team.map(p => p.id)), [team])

  return (
    <div className="screen">
      <div className="container" style={{ paddingBottom: 110 }}>
        <TopBar title="Create Your Team" onBack={onBack} rightSlot={<div className="balance-chip">£{budget.toFixed(1)}m</div>} />

        {loading && <div className="card subtle">Loading players…</div>}
        {error && <div className="card subtle">{error}</div>}

        {!loading && (
          <div className="list">
            {pool.map(p => {
              const picked = pickedIds.has(p.id)
              return (
                <div key={p.id} className="row card">
                  <div>
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <div className="subtle">{p.club} • {p.position}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="price">£{p.price.toFixed(1)}m</div>
                    {picked ? (
                      <button className="btn-remove" onClick={() => removePlayer(p.id)}>Remove</button>
                    ) : (
                      <button className="btn-add" onClick={() => addPlayer(p)}>Add</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="banner" style={{ marginTop: 16 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Finish your squad</div>
            <div className="subtle">Pick players to complete your XI and enter contests.</div>
          </div>
          <button className="cta" onClick={onNext}>Continue</button>
        </div>
      </div>

      <div className="tabbar">
        <button className="tab active"><span>Create Team</span></button>
      </div>
    </div>
  )
}
