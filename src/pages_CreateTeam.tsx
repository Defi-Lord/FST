import { useEffect, useMemo, useState } from 'react'

type Position = 'GK' | 'DEF' | 'MID' | 'FWD'
type Player = {
  id: number
  name: string
  team: string
  position: Position
  price: number  // in millions (e.g. 12.5)
}

const BUDGET_START = 100.0
const LIMITS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 }
const TOTAL_SQUAD = 15
const CLUB_CAP = 3

function formatMoney(n: number) { return `£${n.toFixed(1)}m` }
function remainingBudget(selected: Player[]) {
  return BUDGET_START - selected.reduce((s, p) => s + p.price, 0)
}
function countBy<T extends keyof any>(arr: any[], key: T) {
  return arr.reduce<Record<string, number>>((acc, it) => {
    const k = String(it[key])
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
}
function mapPos(n: number): Position {
  return n === 1 ? 'GK' : n === 2 ? 'DEF' : n === 3 ? 'MID' : 'FWD'
}

async function fetchPlayersFromApi(): Promise<Player[]> {
  // Try same-origin serverless first
  try {
    const r = await fetch('/api/players', { headers: { 'cache-control': 'no-cache' } })
    if (r.ok) {
      const data = await r.json()
      const teamsById: Record<number, string> =
        Object.fromEntries((data.teams as any[]).map((t: any) => [t.id, t.short_name]))
      const players: Player[] = (data.elements as any[]).map((e: any) => ({
        id: e.id,
        name: e.web_name,
        team: teamsById[e.team] ?? String(e.team),
        position: mapPos(e.element_type),
        price: (e.now_cost ?? 0) / 10,
      }))
      return players.sort((a, b) => b.price - a.price)
    }
  } catch { /* fall through */ }

  // Fallback to direct URL from env (if you’ve set it)
  const fallbackUrl = import.meta.env.VITE_FPL_PROXY_URL as string | undefined
  if (!fallbackUrl) throw new Error('Players API unavailable')
  const r2 = await fetch(fallbackUrl, { headers: { 'user-agent': 'Mozilla/5.0' } })
  if (!r2.ok) throw new Error(`Failed to load players: ${r2.status}`)
  const data2 = await r2.json()
  const teamsById2: Record<number, string> =
    Object.fromEntries((data2.teams as any[]).map((t: any) => [t.id, t.short_name]))
  const players2: Player[] = (data2.elements as any[]).map((e: any) => ({
    id: e.id,
    name: e.web_name,
    team: teamsById2[e.team] ?? String(e.team),
    position: mapPos(e.element_type),
    price: (e.now_cost ?? 0) / 10,
  }))
  return players2.sort((a, b) => b.price - a.price)
}

export default function CreateTeam({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack: () => void
}) {
  const [all, setAll] = useState<Player[]>([])
  const [selected, setSelected] = useState<Player[]>([])
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<'ALL' | Position>('ALL')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try { setLoading(true); setAll(await fetchPlayersFromApi()) }
      catch (e: any) { setErr(e?.message ?? 'Failed to load players') }
      finally { setLoading(false) }
    })()
  }, [])

  const budgetLeft = useMemo(() => remainingBudget(selected), [selected])
  const posCount = useMemo(() => {
    const c: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
    selected.forEach(p => { c[p.position]++ })
    return c
  }, [selected])
  const clubCount = useMemo(() => countBy(selected, 'team'), [selected])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return all
      .filter(p => pos === 'ALL' || p.position === pos)
      .filter(p =>
        term === '' ||
        p.name.toLowerCase().includes(term) ||
        p.team.toLowerCase().includes(term) ||
        p.position.toLowerCase().includes(term)
      )
      .sort((a, b) => b.price - a.price) // ensure price-desc after filter
  }, [all, q, pos])

  function canAdd(p: Player): { ok: boolean; reason?: string } {
    if (selected.find(s => s.id === p.id)) return { ok: false, reason: 'Already in squad' }
    if (selected.length >= TOTAL_SQUAD) return { ok: false, reason: 'Squad is full' }
    if (budgetLeft - p.price < 0) return { ok: false, reason: 'Insufficient budget' }
    if (posCount[p.position] >= LIMITS[p.position]) return { ok: false, reason: `Max ${LIMITS[p.position]} ${p.position}` }
    if ((clubCount[p.team] ?? 0) >= CLUB_CAP) return { ok: false, reason: `Max ${CLUB_CAP} from ${p.team}` }
    return { ok: true }
  }

  function add(p: Player) {
    const v = canAdd(p)
    if (!v.ok) { alert(v.reason); return }
    setSelected(prev => [...prev, p])
  }
  function remove(p: Player) {
    setSelected(prev => prev.filter(x => x.id !== p.id))
  }

  const complete =
    selected.length === TOTAL_SQUAD &&
    (['GK', 'DEF', 'MID', 'FWD'] as Position[]).every(k => posCount[k] === LIMITS[k]) &&
    budgetLeft >= 0

  return (
    <div className="screen">
      <div className="bg bg-field" />
      <div className="scrim" />
      <div className="container">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-left">
            <button className="btn-back" onClick={onBack}>←</button>
            <div className="topbar-title">Create Team</div>
          </div>
          <div className="topbar-right">
            <span className="balance-chip">{formatMoney(budgetLeft)} left</span>
          </div>
        </div>

        {/* Budget usage bar */}
        <div className="progress">
          <span
            style={{
              width: `${Math.min(100, Math.max(0, ((BUDGET_START - budgetLeft) / BUDGET_START) * 100))}%`
            }}
          />
        </div>

        {/* Filters */}
        <div className="form-row">
          <select className="select" value={pos} onChange={e => setPos(e.target.value as any)}>
            <option value="ALL">All</option>
            <option value="GK">GK</option>
            <option value="DEF">DEF</option>
            <option value="MID">MID</option>
            <option value="FWD">FWD</option>
          </select>

          <div style={{ flex: 1 }} />
          <div className="chip">GK {posCount.GK}/{LIMITS.GK}</div>
          <div className="chip">DEF {posCount.DEF}/{LIMITS.DEF}</div>
          <div className="chip">MID {posCount.MID}/{LIMITS.MID}</div>
          <div className="chip">FWD {posCount.FWD}/{LIMITS.FWD}</div>
          <div className="chip">Total {selected.length}/{TOTAL_SQUAD}</div>
        </div>

        <div className="search-row">
          <input
            className="input"
            placeholder="Search player, club, or position…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Loading / Error */}
        {loading && <div className="card">Loading players…</div>}
        {err && <div className="card" style={{ borderColor: 'crimson' }}>{err}</div>}

        {/* Player list */}
        {!loading && !err && (
          <div className="list">
            {filtered.map(p => {
              const already = selected.some(s => s.id === p.id)
              const verdict = canAdd(p)
              const disabled = already || !verdict.ok
              const hint = already ? 'Already selected' : verdict.reason

              return (
                <div key={p.id} className={`card row ${already ? 'pill-you' : ''}`}>
                  <div className="row" style={{ gap: 14 }}>
                    <div className="avatar" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{p.name}</strong>
                      <span className="subtle">{p.team} • {p.position}</span>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 10 }}>
                    <span className="price">{formatMoney(p.price)}</span>
                    <button
                      className={already ? 'btn-remove' : 'btn-add'}
                      onClick={() => already ? remove(p) : add(p)}
                      disabled={disabled}
                      title={hint}
                    >
                      {already ? 'Remove' : 'Add'}
                    </button>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <div className="card">No players match your filters.</div>}
          </div>
        )}

        {/* Bottom actions */}
        <div className="bottom-actions">
          <button
            className="cta"
            onClick={() => complete ? onNext() : alert('Select 15 players with valid position limits and budget.')}
            disabled={!complete}
            style={{ opacity: complete ? 1 : 0.6, width: '100%' }}
          >
            {complete ? 'Confirm Squad' : 'Select 15 players'}
          </button>
        </div>

        <div className="safe-bottom" />
      </div>
    </div>
  )
}
