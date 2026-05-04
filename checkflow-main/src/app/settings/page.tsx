'use client'

export default function SettingsPage() {
  return (
    <div style={{ padding: '20px 24px', maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(75,85,99,0.2)', color: '#9CA3AF', border: '1px solid rgba(75,85,99,0.3)', display: 'inline-block', marginBottom: 4 }}>SETTINGS</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>Studio Settings</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>Manage studio preferences and account</p>
      </div>

      {[
        { title: 'Studio Info', fields: [['Studio Name', 'Pentagon Media Group'], ['Location', 'Atlanta, GA'], ['Contact Email', 'bookings@theentagon.com']] },
        { title: 'Session Defaults', fields: [['Default Room', 'Studio A'], ['Default Engineer', 'Marcus Webb'], ['Session Duration', '3 hours']] },
      ].map(({ title, fields }) => (
        <div key={title} style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #1A1F38' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>{title}</h2>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fields.map(([label, defaultVal]) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 5, letterSpacing: '0.06em' }}>{label.toUpperCase()}</label>
                <input defaultValue={defaultVal} style={{ width: '100%', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#E8ECF4', outline: 'none' }} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', minHeight: 42, background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Save Changes
      </button>
    </div>
  )
}
