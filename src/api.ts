// src/api.ts
const API_BASE = '/api/fpl'
const UPSTREAM = 'https://fantasy.premierleague.com/api'

async function getFrom(urls: string[]) {
  let lastErr: any = null
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) {
        const t = await r.text().catch(() => '')
        throw new Error(`HTTP ${r.status} ${r.statusText} :: ${t.slice(0, 120)}`)
      }
      return r.json()
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('All fetch attempts failed')
}

export function fetchBootstrap() {
  // Try your Vercel proxy first; if it fails, hit FPL upstream directly
  return getFrom([
    `${API_BASE}/bootstrap-static`,
    `${UPSTREAM}/bootstrap-static/`
  ])
}

export function fetchFixtures() {
  return getFrom([
    `${API_BASE}/fixtures?future=1`,
    `${UPSTREAM}/fixtures/?future=1`
  ])
}
