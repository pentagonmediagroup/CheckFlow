'use client'
export default function SettingsPage() {
  return (
    <div className="page-pad">
      <div style={{ marginBottom:22 }}>
        <div className="page-badge" style={{ background:'rgba(75,85,99,.2)',color:'#9CA3AF',border:'1px solid rgba(75,85,99,.3)' }}>SETTINGS</div>
        <h1 style={{ fontSize:24,fontWeight:700 }}>Studio Settings</h1>
      </div>
      {[
        { title:'Studio Info', fields:[['Studio Name','Pentagon Media Group'],['Location','Atlanta, GA'],['Contact Email','bookings@thepentagon.com']] },
        { title:'Defaults',    fields:[['Default Studio','Studio A'],['Session Duration','60 minutes']] },
      ].map(({title,fields})=>(
        <div key={title} className="card" style={{ overflow:'hidden',marginBottom:14 }}>
          <div style={{ padding:'11px 18px',borderBottom:'1px solid #2D1F4E',fontSize:14,fontWeight:600,color:'#EAB308' }}>{title}</div>
          <div style={{ padding:18,display:'flex',flexDirection:'column',gap:12 }}>
            {fields.map(([label,def])=>(
              <div key={label}>
                <label className="label">{label}</label>
                <input defaultValue={def} style={{ background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#E8ECF4',width:'100%',outline:'none' }}/>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button className="btn btn-primary">Save Changes</button>
    </div>
  )
}
