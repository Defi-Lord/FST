export default function Landing({ onLaunch }: { onLaunch: ()=>void }){
  return (
    <div className="screen">
      <div className="bg bg-landing"/><div className="scrim"/>
      <div className="container center" style={{marginTop:'40vh'}}>
        <div className="headline" style={{color:'#e8edf2'}}>
          Create your Premier League fantasy team,<br/>join contests, and climb the leaderboard!
        </div>
        <button className="cta" onClick={onLaunch}>⚽ Start</button>
      </div>
    </div>
  )
}
