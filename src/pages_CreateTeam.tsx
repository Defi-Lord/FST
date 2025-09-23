// src/pages_CreateTeam.tsx
import { useEffect, useMemo, useState } from 'react'
import { useApp, type Player, Position } from './state'
import TopBar from './components_TopBar'

// ---- Fetch helpers (direct upstream first, then /api, then /public fallback) ----
const UPSTREAM = 'https://fantasy.premierleague.com/api'
const API_BASE = '/api/fpl'

async function getJson(url: string) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`HTTP ${r.status} ${r.statusText} :: ${t.slice(0, 160)}`)
  }
  return r.json()
}

async function fetchBootstrapMulti() {
  // 1) FPL upstream (usually CORS-OK), 2) your Vercel proxy
  const tries = [`${UPSTREAM}/bootstrap-static/`, `${API_BASE}/bootstrap-static`]
  let lastErr: any = null
  for (const u of tries) {
    try { return await getJson(u) } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('All bootstrap attempts failed')
}

async function fetchFallbackPlayers(): Promise<Player[]> {
  const r = await fetch('/fallback-players.json', { cache: 'no-store' })
  const arr = (await r.json()) as any[]
  return arr.map(p => ({
    id: String(p.id),
    name: p.name,
    club: p.club,
    position: p.position as Position,
    price: Number(p.price),
    form: Number(p.form),
  }))
}

// ---- Types from FPL ----
type FplElement = {
  id: number
  web_name: string
  team: number
  now_cost: number        // tenths of a million (e.g. 96 -> £9.6m)
  element_type: number    // 1 GK, 2 DEF, 3 MID, 4 FWD
  form: string            // "8.4"
}
type FplTeam = { id: number; name: string }

const MAX_SQUAD = 15

function mapTypeToPosition(t: number): Position {
  return (['', 'GK', 'DEF', 'MID', 'FWD'] as const)[t] as Position
}

export default function CreateTeam({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack?: () => void
}) {
  const { team, addPlayer, removePlayer, budget } = useApp()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pool, setPool] = useState<Player[]>([])

  // UI state
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<'value' | 'form'>('value')

  // Coerce ids to match store type (string/number)
  const storeIdType: 'string' | 'number' = useMemo(() => {
    const sample = team[0]?.id
    return typeof sample === 'number' ? 'number' : 'string'
  }, [team])
  const coerceId = (id: string | number) =>
    storeIdType === 'number' ? Number(id) : String(id)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true); setError(null)
      try {
        // Try upstream then proxy
        const data = await fetchBootstrapMulti()
        const teams: FplTeam[] = data?.teams ?? []
        const elements: FplElement[] = data?.elements ?? []
        const teamNameById = new Map(teams.map(t => [t.id, t.name]))
        const mapped: Player[] = elements.map(e => ({
          id: coerceId(e.id) as any,
          name: e.web_name,
          club: teamNameById.get(e.team) || `Team ${e.team}`,
          position: mapTypeToPosition(e.element_type),
          price: Number((e.now_cost || 0) / 10),
          form: Number(parseFloat(e.form || '0')),
        }))
        if (!mounted) return
        setPool(mapped)
      } catch (err: any) {
        // Use public fallback so page remains functional
        try {
          const mapped = await fetchFallbackPlayers()
          if (!mounted) return
          setPool(mapped)
          setError('Couldn’t load real FPL players. Showing fallback list.')
        } catch (e) {
          if (!mounted) return
          setPool([])
          setError('Couldn’t load players (FPL + fallback both failed).')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [storeIdType])

  const pickedIds = useMemo(() => new Set(team.map(p => coerceId(p.id))), [team, storeIdType])
  const selectedCount = team.length

  // Filter + sort (Value high→low, tiebreak by Form, then name)
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
    const normalized: Player = { ...p, id: coerceId(p.id) as any }
    if (selectedCount >= MAX_SQUAD) { alert(`You can only pick ${MAX_SQUAD} players.`); return }
    if (budget < normalized.price) { alert(`Not enough budget. You have £${budget.toFixed(1)}m, but ${normalized.name} costs £${normalized.price.toFixed(1)}m.`); return }
    const ok = (addPlayer as any)(normalized)
    if (ok === false) alert('Could not add player due to squad constraints.')
  }

  function onRemove(id: Player['id']) {
    const ok = (removePlayer as any)(coerceId(id))
    if (ok === false) alert('Could not remove player.')
  }

  const canProceed = selectedCount > 0 && selectedCount <= MAX_SQUAD

  return (
    <div className="screen">
      <div className="container" style={{ paddingBottom: 110 }}>
        <TopBar
          title="Create Your Team"
          onBack={onBack}
          rightSlot={<div className="balance-chip">£{budget.toFixed(1)}m</div>}
        />

        {/* Chips */}
        <div className="row" style={{ alignItems: 'center', gap: 10, marginTop: 8 }}>
          <div className="chip">Budget: £{budget.toFixed(1)}m</div>
          <div className="chip">Selected: {selectedCount}/{MAX_SQUAD}</div>
        </div>

        {/* Search + Sort */}
        <div className="form-row" style={{ marginTop: 10 }}>
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
            style={{ marginLeft: 10 }}
          >
            <option value="value">Sort: Value (High→Low)</option>
            <option value="form">Sort: Form (High→Low)</option>
          </select>
        </div>

        {loading && <div className="card subtle" style={{ marginTop: 10 }}>Loading players…</div>}
        {error && <div className="card subtle" style={{ marginTop: 10 }}>{error}</div>}

        {!loading && (
          <div className="list" style={{ marginTop: 10 }}>
            {visible.length === 0 && <div className="card subtle">No players match your search.</div>}

            {visible.map(p => {
              const idKey = coerceId(p.id)
              const picked = pickedIds.has(idKey)
              const disableAdd = selectedCount >= MAX_SQUAD || budget < p.price

              return (
                <div key={String(idKey)} className="row card">
                  <div>
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <div className="subtle">
                      {p.club} • {p.position} • Form {Number(p.form || 0).toFixed(1)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="price">£{p.price.toFixed(1)}m</div>

                    {picked ? (
                      <button className="btn-remove" onClick={() => onRemove(idKey as any)}>
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
          <button className="cta" disabled={!canProceed} onClick={onNext}>
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
