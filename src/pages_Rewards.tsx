export default function Rewards({ onClaim }: { onClaim: ()=>void }){
  return (
    <div className="screen">
      <div className="bg bg-field"/><div className="scrim"/>

      <div className="container">
        <div className="title-xxl">Rewards</div>
        <div className="card" style={{marginTop:16}}>
          <div style={{fontWeight:800, marginBottom:6}}>Welcome bonus</div>
          <div className="subtle">Head to “Create Your Team” to use your £100m budget.</div>
        </div>
      </div>

      <div className="bottom-actions">
        <button className="cta" style={{width:'92%',margin:'0 auto',display:'block'}} onClick={onClaim}>
          Continue
        </button>
      </div>
    </div>
  )
}
