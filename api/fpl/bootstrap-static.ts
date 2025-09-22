export const config = { runtime: 'edge' }

export default async (req: Request) => {
  const upstream = 'https://fantasy.premierleague.com/api/bootstrap-static/'
  try {
    const r = await fetch(upstream, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    })
    const body = await r.text()
    return new Response(body, {
      status: r.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    })
  } catch (e: any) {
    return new Response('Upstream fetch failed: ' + (e?.message || e), {
      status: 502,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
