const API_BASE = '/api/fpl'

async function getJson(url: string) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`HTTP ${r.status} ${r.statusText} :: ${text.slice(0,180)}`)
  }
  return r.json()
}

export const fetchBootstrap = () => getJson(`${API_BASE}/bootstrap-static`)
export const fetchFixtures  = () => getJson(`${API_BASE}/fixtures?future=1`)
