// src/pages_CreateTeam.tsx
import { useEffect, useMemo, useState } from 'react'
import { useApp, type Player, Position } from './state'
import TopBar from './components_TopBar'
import { fetchBootstrap } from './api'

type FplElement = {
  id: number
  web_name: string
  team: number
  now_cost: number       // tenths of a million (e.g. 96 -> 9.6m)
  element_type: number   // 1 GK, 2 DEF, 3 MID, 4 FWD
  form: string           // "8.4"
}
type FplTeam = { id: number; name: string }

const MAX_SQUAD = 15

function mapTypeToPosition(t: number): Position {
  return (['', 'GK','DEF','MID','FWD'] as any)[t] as Position
}

function normalizePlayer(e: FplElement, teamNameById: Map<number, string>): Player {
  // IMPORTANT: id as STRING to match your state (your local JSON had string ids).
  return {
    id: String(e.id),
    name: e.web_name,
    club: teamNameById.get(e.team) || `Team ${e.team}`,
    position: mapTypeToPosition(e.element_type),
    price: Number((e.now_cost || 0) / 10),
    form: Number(parseFloat(e.form || '0')),
  }
}

export default function CreateTeam({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  const { team, addPlayer, removePlayer, budget } = useApp()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pool, setPool] = useState<Player[]>([])

  // UI state
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<'value' | 'form'>('value')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchBootstrap() // /api/fpl/bootstrap-static
        const teams: FplTeam[] = data?.teams || []
        const elements: FplElement[] = data?.elements || []

        const teamNameById = new Map(teams.map(t => [t.id, t.name]))
        const mapped: Player[] = elements.map(e => normalizePlayer(e, teamNameById))
        if (!mounted) return
        setPool(mapped)
      } catch {
        if (!mounted) return
        setError('Couldn’t load real FPL players. Showing fallback list — real FPL fetch failed. Check your /api setup.')

        // fallback from /public
        try {
          const r = await fetch('/fallback-players.json', { cache: 'no-store' })
          const arr = (await r.json()) as any[]
          const mapped: Player[] = arr.map(p => ({
            id: String(p.id),
            name: p.name,
            club: p.club,
            position: p.position as Position,
            price: Number(p.price),
            form: Number(p.form),
          }))
          setPool(mapped)
        } catch {
          setPool([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Normalize team ids to string (so Set membership works even if some came in as numbers earlier)
  const pickedIds = useMemo(() => new Set(team.map(p => String(p.id))), [team])
  const selectedCount = team.length

  // Filter + sort
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = needle
      ? pool.filter(p =>
          p.name.toLowerCase().includes(needle) ||
          p.club.toLowerCase().includes(needle) ||
          p.position.toLowerCase().includes(needle)
        )
      : pool.slice()

    filtered.sort((a, b) => {
      const prim = sortBy === 'value' ? b.price - a.price : b.form - a.form
      if (prim !== 0) return prim
      const sec = b.form - a.form
      if (sec !== 0) return sec
      return a.name.localeCompare(b.name)
    })
    return filtered
  }, [pool, q, sortBy])

  function tryAdd(p: Player) {
    if (selectedCount >= MAX_SQUAD) {
      alert(`You can only pick ${MAX_SQUAD} players.`)
      return
    }
    if (budget < p.price) {
      alert(`Not enough budget. You have £${budget.toFixed(1)}m, but ${p.name} costs £${p.price.toFixed(1)}m.`)
      return
    }
    // Ensure we pass the normalized Player shape your state expects
    addPlayer({ ...p, id: String(p.id) })
  }

  return (
    <div className="screen">
      <div className="container" style={{ paddingBottom: 110 }}>
        <TopBar
          title="Create Your Team"
          onBack={onBack}
          rightSlot={<div className="balance-chip">£{budget.toFixed(1)}m</div>}
        />

        {/* Header chips */}
        <div className="row" style={{alignItems:'center', gap:10, marginTop:8}}>
          <div className="chip">Budget: £{budget.toFixed(1)}m</div>
          <div className="chip">Selected: {selectedCount}/{MAX_SQUAD}</div>
        </div>

        {/* Search + sort */}
        <div className="form-row" style={{marginTop:10}}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search players, club, position…"
            className="input"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="select"
            style={{marginLeft:10}}
          >
            <option value="value">Sort: Value (High→Low)</option>
            <option value="form">Sort: Form (High→Low)</option>
          </select>
        </div>

        {loading && <div className="card subtle" style={{marginTop:10}}>Loading players…</div>}
        {error && <div className="card subtle" style={{marginTop:10}}>{error}</div>}

        {!loading && (
          <div className="list" style={{marginTop:10}}>
            {visible.length === 0 && (
              <div className="card subtle">No players match your search.</div>
            )}
            {visible.map(p => {
              const idStr = String(p.id)
              const picked = pickedIds.has(idStr)
              const disableAdd = selectedCount >= MAX_SQUAD || budget < p.price

              return (
                <div key={idStr} className="row card">
                  <div>
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <div className="subtle">
                      {p.club} • {p.position} • Form {p.form.toFixed(1)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="price">£{p.price.toFixed(1)}m</div>

                    {picked ? (
                      <button className="btn-remove" onClick={() => removePlayer(idStr)}>
                        Remove
                      </button>
                    ) : (
                      <button
                        className="btn-add"
                        disabled={disableAdd}
                        onClick={() => tryAdd(p)}
                        title={
                          selectedCount >= MAX_SQUAD
                            ? `Max ${MAX_SQUAD} players reached`
                            : budget < p.price
                            ? `Need £${(p.price - budget).toFixed(1)}m more`
                            : ''
                        }
                      >
                        Add
                      </button>
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
            <div className="subtle">
              Pick up to {MAX_SQUAD} players within your £100m budget, then enter contests.
            </div>
          </div>
          <button className="cta" disabled={selectedCount === 0 || selectedCount > MAX_SQUAD} onClick={onNext}>
            Continue
          </button>
        </div>
      </div>

      <div className="tabbar">
        <button className="tab active"><span>Create Team</span></button>
      </div>
    </div>
  )
}
