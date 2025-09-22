// src/api.ts
const API_BASE = '/api/fpl'

async function getJson(url: string) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`HTTP ${r.status} ${r.statusText} :: ${text.slice(0, 180)}`)
  }
  return r.json()
}

export function fetchBootstrap() {
  return getJson(`${API_BASE}/bootstrap-static`)
}

export function fetchFixtures() {
  return getJson(`${API_BASE}/fixtures?future=1`)
}
