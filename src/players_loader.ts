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

// ✅ Correct way to read Vite env:
const ENV_URL = (import.meta as any).env?.VITE_FPL_PROXY_URL as string | undefined

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

async function tryLoad(url: string): Promise<Player[] | null> {
  try {
    console.log('[FPL] Fetching:', url)
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.warn('[FPL] Non-200:', res.status, res.statusText, 'for', url)
      return null
    }
    const json = await res.json() as FplBootstrap
    if (!Array.isArray(json?.elements) || json.elements.length < 50) {
      console.warn('[FPL] Unexpected payload (elements < 50) from', url)
      return null
    }
    const mapped = mapFplToPlayers(json)
    console.log('[FPL] Loaded', mapped.length, 'players from', url)
    return mapped
  } catch (e: any) {
    console.warn('[FPL] Fetch error for', url, e?.message || e)
    return null
  }
}

/**
 * Order:
 * 1) VITE_FPL_PROXY_URL (e.g., http://localhost:3300/fpl/bootstrap-static)
 * 2) /fpl/bootstrap-static (Vite dev proxy or prod rewrite)
 * 3) /bootstrap-static.json (local snapshot in /public)
 */
export async function loadPlayers(): Promise<Player[] | null> {
  if (ENV_URL) {
    const envPlayers = await tryLoad(ENV_URL)
    if (envPlayers) return envPlayers
  }

  const devPlayers = await tryLoad('/fpl/bootstrap-static')
  if (devPlayers) return devPlayers

  const localPlayers = await tryLoad('/bootstrap-static.json')
  if (localPlayers) return localPlayers

  return null
}
