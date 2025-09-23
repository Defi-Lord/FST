// api/players.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SRC = process.env.FPL_SOURCE
  ?? 'https://fantasy.premierleague.com/api/bootstrap-static/';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const r = await fetch(SRC, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) return res.status(r.status).json({ error: `Upstream ${r.status}` });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'proxy failed' });
  }
}
