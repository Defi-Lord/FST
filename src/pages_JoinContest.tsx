import React, { useState } from 'react'
import TopBar from './components_TopBar'

type Contest = { name: string; price?: string; active?: boolean }
const contests: Contest[] = [
  { name: 'Premier League',   active: true },
  { name: 'Champions League' },
  { name: 'Spanish League'   },
  { name: 'Turkish League'   },
  { name: 'French League'    }
]

export default function JoinContest({ onSelect, onBack }: { onSelect: () => void; onBack: () => void }) {
  const [coming, setComing] = useState<string | null>(null)

  return (
    <div className="screen">
      <div className="bg bg-field"/><div className="scrim"/>
      <div className="container">
        <TopBar title="Join Contest" onBack={onBack} />
        <div className="list">
          {contests.map((c, i) => {
            const active = !!c.active
            return (
              <button
                key={i}
                className="row card"
                style={{textAlign:'left', opacity: active ? 1 : .6}}
                onClick={() => active ? onSelect() : setComing(c.name)}
              >
                <div style={{fontWeight:800}}>
                  <div>{c.name}</div>
                  <div className="subtle">League</div>
                </div>
                <div style={{fontWeight:800}}>
                  {active ? 'Enter' : 'Coming soon'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {coming && (
        <div className="modal">
          <div className="modal-card">
            <div style={{fontWeight:900, fontSize:20, marginBottom:8}}>Coming soon</div>
            <div className="subtle" style={{marginBottom:14}}>
              {coming} contests are not open yet. We’ll notify you when it’s ready.
            </div>
            <button className="cta" onClick={() => setComing(null)}>Okay</button>
          </div>
        </div>
      )}
    </div>
  )
}
