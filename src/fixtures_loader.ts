// src/fixtures_loader.ts
// Loads real fixtures from FPL via your proxy/relay, with timeouts + clear logs.

type Team = { id: number; name: string }
type Bootstrap = { teams: Team[] }

type FplFixture = {
  id: number
  event: number | null
  kickoff_time: string | null
  team_h: number
  team_a: number
  finished: boolean
  finished_provisional: boolean
}

export type Fixture = {
  id: string
  kickoff_utc: string
  home: string
  away: string
  event?: number | null
}

function apiBase(): string {
  // If you set VITE_FPL_PROXY_URL to ".../bootstrap-static", derive base.
  // Else fall back to "/fpl" (Vite dev proxy OR your prod rewrite/worker).
  const envUrl = (import.meta as any)?.env?.VITE_FPL_PROXY_URL as string | undefined
  if (envUrl) return envUrl.replace(/\/+$/,'').replace(/\/bootstrap-static$/,'')
  return '/fpl'
}

async function fetchJSON<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort('timeout'), timeoutMs)
  try {
    console.log('[FPL][GET]', url)
    const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
    if (!r.ok) { console.warn('[FPL] non-200', r.status, r.statusText, 'for', url); return null }
    return await r.json() as T
  } catch (e: any) {
    console.warn('[FPL] fetch error for', url, e?.message || e)
    return null
  } finally { clearTimeout(timer) }
}

/** Soonest upcoming fixture mapped to team names. */
export async function loadNextFixture(): Promise<Fixture | null> {
  const base = apiBase()

  const bootstrap = await fetchJSON<Bootstrap>(`${base}/bootstrap-static`)
  const teams = new Map<number, string>((bootstrap?.teams ?? []).map(t => [t.id, t.name]))
  if (!teams.size) console.warn('[Fixtures] teams map is empty (bootstrap-static failed?)')

  const fixtures = await fetchJSON<FplFixture[]>(`${base}/fixtures`)
  if (!Array.isArray(fixtures) || !fixtures.length) {
    console.warn('[Fixtures] fixtures fetch failed or empty')
    return null
  }

  const now = Date.now()
  const upcoming = fixtures
    .map(f => ({ f, t: f.kickoff_time ? Date.parse(f.kickoff_time) : NaN }))
    .filter(x => Number.isFinite(x.t) && x.t > now)
    .sort((a, b) => a.t - b.t)

  if (!upcoming.length) return null
  const f = upcoming[0].f

  return {
    id: String(f.id),
    kickoff_utc: f.kickoff_time as string,
    home: teams.get(f.team_h) ?? `Team ${f.team_h}`,
    away: teams.get(f.team_a) ?? `Team ${f.team_a}`,
    event: f.event ?? undefined,
  }
}

/** Optional: N upcoming fixtures if you want a full Fixtures page later. */
export async function loadUpcomingFixtures(limit = 10): Promise<Fixture[] | null> {
  const base = apiBase()
  const bootstrap = await fetchJSON<Bootstrap>(`${base}/bootstrap-static`)
  const teams = new Map<number, string>((bootstrap?.teams ?? []).map(t => [t.id, t.name]))

  const fixtures = await fetchJSON<FplFixture[]>(`${base}/fixtures`)
  if (!Array.isArray(fixtures) || !fixtures.length) return null

  const now = Date.now()
  return fixtures
    .map(f => ({ f, t: f.kickoff_time ? Date.parse(f.kickoff_time) : NaN }))
    .filter(x => Number.isFinite(x.t) && x.t > now)
    .sort((a, b) => a.t - b.t)
    .slice(0, limit)
    .map(({ f }) => ({
      id: String(f.id),
      kickoff_utc: f.kickoff_time as string,
      home: teams.get(f.team_h) ?? `Team ${f.team_h}`,
      away: teams.get(f.team_a) ?? `Team ${f.team_a}`,
      event: f.event ?? undefined,
    }))
}
