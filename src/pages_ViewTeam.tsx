// src/pages_ViewTeam.tsx
import { useMemo } from 'react'
import { useApp, Position } from './state'
import TopBar from './components_TopBar'

const FORMATIONS: Array<'4-4-2' | '4-3-3' | '3-4-3' | '3-5-2' | '5-3-2'> =
  ['4-4-2','4-3-3','3-4-3','3-5-2','5-3-2']

function groupBy<T extends { position: Position }>(arr: T[]){
  return {
    GK: arr.filter(a=>a.position==='GK'),
    DEF: arr.filter(a=>a.position==='DEF'),
    MID: arr.filter(a=>a.position==='MID'),
    FWD: arr.filter(a=>a.position==='FWD')
  }
}

export default function ViewTeam({ onBack }: { onBack?: () => void }){
  const { team, formation, setFormation, removePlayer, budget } = useApp()
  const grouped = useMemo(() => groupBy(team), [team])

  return (
    <div className="screen">
      <div className="container" style={{paddingBottom:110}}>
        <TopBar
          title="Your Team"
          onBack={onBack}  // safe if undefined
          rightSlot={<div className="balance-chip">£{budget.toFixed(1)}m</div>}
        />

        <div className="form-row">
          <span className="subtle">Formation</span>
          <select value={formation} onChange={e => setFormation(e.target.value as any)} className="select">
            {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {(['GK','DEF','MID','FWD'] as Position[]).map((pos) => (
          <div key={pos} style={{marginTop:14}}>
            <div style={{fontWeight:900, margin:'6px 0'}}>{pos}</div>
            <div className="list">
              {grouped[pos].length === 0 && (
                <div className="card subtle">No {pos} selected.</div>
              )}
              {grouped[pos].map(p => (
                <div key={p.id} className="row card">
                  <div>
                    <div style={{fontWeight:800}}>{p.name}</div>
                    <div className="subtle">{p.club}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div className="price">£{p.price.toFixed(1)}m</div>
                    <button className="btn-remove" onClick={() => removePlayer(p.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="tabbar">
        <button className="tab active"><span>View Team</span></button>
      </div>
    </div>
  )
}
