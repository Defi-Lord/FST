// Vercel Node serverless function (not Edge)
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { runtime: 'nodejs18.x' } // ensure Node runtime

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const upstream = 'https://fantasy.premierleague.com/api/bootstrap-static/'
  try {
    const r = await fetch(upstream, {
      headers: {
        // mimic a real browser; some CDNs care
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        'Accept': 'application/json'
      },
      // avoid stale caches on misbehaving proxies
      cache: 'no-store'
    })
    const text = await r.text()
    res
      .status(r.status)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Cache-Control', 'public, max-age=300')
      .send(text)
  } catch (e: any) {
    res
      .status(502)
      .setHeader('Content-Type', 'text/plain')
      .send('Upstream fetch failed: ' + (e?.message ?? String(e)))
  }
}
