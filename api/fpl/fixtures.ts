import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const qs = req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
  const upstream = 'https://fantasy.premierleague.com/api/fixtures/' + qs
  try {
    const r = await fetch(upstream, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FST-TelegramMiniApp/1.0)',
        'Accept': 'application/json'
      }
    })
    const body = await r.text()
    res.status(r.status)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Cache-Control', 'public, max-age=300')
      .send(body)
  } catch (e: any) {
    res.status(502).setHeader('Content-Type', 'text/plain')
      .send('Upstream fetch failed: ' + (e?.message || String(e)))
  }
}
