// api/ping.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
export const config = { runtime: 'nodejs18.x' }
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(JSON.stringify({ ok: true, now: Date.now() }))
}
