import type { VercelRequest, VercelResponse } from '@vercel/node'
export const config = { runtime: 'nodejs18.x' }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const qs = req.url && req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
  const upstream = 'https://fantasy.premierleague.com/api/fixtures/' + qs
  try {
    const r = await fetch(upstream, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://fantasy.premierleague.com/',
        'Accept-Language': 'en-GB,en;q=0.9'
      },
      cache: 'no-store'
    })
    const text = await r.text()
    res.status(r.status)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Cache-Control', 'public, max-age=300')
      .send(text)
  } catch (e: any) {
    res.status(502).setHeader('Content-Type', 'text/plain')
      .send('Upstream fetch failed: ' + (e?.message ?? String(e)))
  }
}
