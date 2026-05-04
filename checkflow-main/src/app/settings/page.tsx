'use client'
export default function SettingsPage() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(75,85,99,0.2)', color: '#9CA3AF', border: '1px solid rgba(75,85,99,0.3)', display: 'inline-block', marginBottom: 4 }}>SETTINGS</span>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8ECF4' }}>Studio Settings</h1>
      </div>
      {[
        { title: 'Studio Info', fields: [['Studio Name','Pentagon Media Group'],['Location','Atlanta, GA'],['Contact Email','bookings@thepentagon.com']] },
        { title: 'Defaults', fields: [['Default Studio','Studio A'],['Session Duration','60 minutes']] },
      ].map(({ title, fields }) => (
        <div key={title} style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #2D1F4E', fontSize: 14, fontWeight: 600, color: '#EAB308' }}>{title}</div>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fields.map(([label, def]) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>{label}</label>
                <input defaultValue={def} style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#E8ECF4', width: '100%', outline: 'none' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
    </div>
  )
}
