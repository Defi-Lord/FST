// server.mjs  (Node 18+ has global fetch)
import http from 'node:http'
import { URL } from 'node:url'

const PORT = 3300

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`)
  if (u.pathname === '/fpl/bootstrap-static') {
    const upstream = 'https://fantasy.premierleague.com/api/bootstrap-static/'
    try {
      const r = await fetch(upstream, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      })
      const body = await r.text()
      res.writeHead(r.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      })
      res.end(body)
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain' })
      res.end('Upstream fetch failed: ' + (e?.message || e))
    }
    return
  }
  res.writeHead(404); res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`FPL relay running: http://localhost:${PORT}/fpl/bootstrap-static`)
})
