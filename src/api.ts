// src/api.ts
const API_BASE = '/api/fpl'

export async function fetchBootstrap() {
  const r = await fetch(`${API_BASE}/bootstrap-static`)
  if (!r.ok) throw new Error('bootstrap fetch failed: ' + r.status)
  return r.json()
}

export async function fetchFixtures() {
  const r = await fetch(`${API_BASE}/fixtures?future=1`)
  if (!r.ok) throw new Error('fixtures fetch failed: ' + r.status)
  return r.json()
}
