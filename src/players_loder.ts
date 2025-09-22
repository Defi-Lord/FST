// src/players_loader.ts
import type { Player, Position } from './state'

type FplBootstrap = {
  elements: Array<{
    id: number
    first_name: string
    second_name: string
    web_name: string
    team: number
    element_type: number
    now_cost: number // tenths of £m
    form: string     // "x.y"
  }>
  teams: Array<{ id: number; name: string }>
}

const POSITIONS: Record<number, Position> = { 1:'GK', 2:'DEF', 3:'MID', 4:'FWD' }

const PROD_URL = (import.meta as any)?.env?.VITE_FPL_PROXY_URL as string | undefined
const DEV_URL  = '/fpl/bootstrap-static'
const LOCAL_SNAPSHOT_URL = '/bootstrap-static.json' // <- put a copy in /public

function pickName(e: FplBootstrap['elements'][number]) {
  const full = `${e.first_name ?? ''} ${e.second_name ?? ''}`.trim()
  return e.web_name || full || `#${e.id}`
}
function safeParseFloat(x: unknown): number | undefined {
  const n = typeof x === 'string' ? parseFloat(x) : NaN
  return Number.isFinite(n) ? n : undefined
}

function mapFplToPlayers(data: FplBootstrap): Player[] {
  const teamName = new Map(data.teams.map(t => [t.id, t.name]))
  const players: Player[] = data.elements.map(e => ({
    id: String(e.id),
    name: pickName(e),
    club: teamName.get(e.team) ?? 'Unknown',
    position: POSITIONS[e.element_type] ?? 'MID',
    price: +(e.now_cost / 10).toFixed(1),
    form: safeParseFloat(e.form),
  }))
  players.sort((a,b) => (b.form ?? 0) - (a.form ?? 0))
  return players
}

async function tryFetch(url: string) {
  try { return await fetch(url, { cache: 'no-store' }) } catch { return null }
}
async function tryLoad(url: string): Promise<Player[] | null> {
  const res = await tryFetch(url)
  if (!res?.ok) return null
  try {
    const json = await res.json() as FplBootstrap
    if (!Array.isArray(json?.elements) || json.elements.length < 50) return null
    return mapFplToPlayers(json)
  } catch { return null }
}

/**
 * Tries: VITE_FPL_PROXY_URL -> /fpl/bootstrap-static -> /bootstrap-static.json.
 * Returns null only if all fail (so caller can use SAMPLE_PLAYERS).
 */
export async function loadPlayers(): Promise<Player[] | null> {
  // 1) production relay (if provided)
  if (PROD_URL) {
    const p = await tryLoad(PROD_URL)
    if (p) { console.log('Loaded players via PROD relay:', p.length); return p }
  }
  // 2) dev proxy
  const d = await tryLoad(DEV_URL)
  if (d) { console.log('Loaded players via DEV proxy:', d.length); return d }

  // 3) local snapshot (ship a copy in /public to guarantee fullness)
  const l = await tryLoad(LOCAL_SNAPSHOT_URL)
  if (l) { console.log('Loaded players via local snapshot:', l.length); return l }

  // 4) final failure
  console.warn('FPL load failed (prod, dev, local snapshot). Falling back to SAMPLE.')
  return null
}
