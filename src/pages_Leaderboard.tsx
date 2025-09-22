import { useEffect, useMemo, useState } from 'react'
import { useApp } from './state'
import TopBar from './components_TopBar'

type Entry = { name: string; points: number; you?: boolean }

async function loadLeaderboard(): Promise<Entry[] | null> {
  try {
    const res = await fetch('/leaderboard.json', { cache: 'no-store' })
    if (!res.ok) return null
    const arr = await res.json()
    return Array.isArray(arr) ? arr : null
  } catch { return null }
}

export default function Leaderboard({ onNext, onBack }: { onNext?: () => void; onBack: () => void }) {
  const { fullName, myPoints, recomputePoints } = useApp()
  const [external, setExternal] = useState<Entry[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { recomputePoints() }, [recomputePoints])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const data = await loadLeaderboard()
      if (!mounted) return
      setExternal(data)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const data: Entry[] = useMemo(() => {
    const local = [
      { name: 'Peter', points: 180 },
      { name: 'Carios', points: 165 },
      { name: 'Bruno', points: 150 }
    ]
    const base = external && external.length ? external : local
    const merged = [...base, { name: fullName, points: myPoints, you: true }]
    return merged.sort((a,b)=>b.points - a.points)
  }, [external, fullName, myPoints])

  return (
    <div className="screen">
      <div className="bg bg-leader"/><div className="scrim"/>
      <div className="container safe-bottom">
        <TopBar title="Leaderboard" onBack={onBack} />
        <div className="list">
          {loading && <div className="card">Loading leaderboard…</div>}
          {!loading && data.map((e,i) => (
            <div className={`row card ${e.you ? 'pill-you' : ''}`} key={i}>
              <div>
                <div style={{fontWeight:800}}>{e.name}{e.you ? ' (You)' : ''}</div>
                <div className="subtle">Points</div>
              </div>
              <div style={{fontWeight:800}}>{e.points}</div>
            </div>
          ))}
        </div>
      </div>

      {onNext && (
        <div className="bottom-actions">
          <button className="cta" style={{width:'100%'}} onClick={onNext}>Go to Rewards</button>
        </div>
      )}
    </div>
  )
}
