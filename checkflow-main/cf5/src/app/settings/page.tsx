'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check } from 'lucide-react'

const SETTING_GROUPS = [
  {
    title: 'Studio Info',
    fields: [
      { key: 'studio_name',    label: 'Studio Name',     placeholder: 'Pentagon Media Group' },
      { key: 'location',       label: 'Location',         placeholder: 'Atlanta, GA' },
      { key: 'contact_email',  label: 'Contact Email',    placeholder: 'bookings@thepentagon.com' },
      { key: 'phone',          label: 'Phone',            placeholder: '404-000-0000' },
      { key: 'instagram',      label: 'Instagram',        placeholder: '@thepentagonmg' },
      { key: 'website',        label: 'Website',          placeholder: 'https://thepentagon.com' },
    ],
  },
  {
    title: 'Session Defaults',
    fields: [
      { key: 'default_studio',   label: 'Default Studio',   placeholder: 'Studio A' },
      { key: 'default_duration', label: 'Default Duration (minutes)', placeholder: '60' },
    ],
  },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('studio_settings').select('key,value').then(({ data }) => {
      const map: Record<string, string> = {}
      ;(data || []).forEach((r: any) => { map[r.key] = r.value || '' })
      setValues(map)
      setLoading(false)
    })
  }, [])

  const set = (k: string, v: string) => setValues(prev => ({ ...prev, [k]: v }))

  const save = async () => {
    setSaving(true)
    const upserts = Object.entries(values).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))
    const { error } = await supabase.from('studio_settings').upsert(upserts, { onConflict: 'key' })
    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp = { background:'#0F0A1E', border:'1px solid #2D1F4E', borderRadius:12, padding:'11px 14px', fontSize:14, color:'#E8ECF4', width:'100%', outline:'none', fontFamily:'inherit' }

  return (
    <div className="page-pad">
      <div style={{ marginBottom:24 }}>
        <div className="page-badge" style={{ background:'rgba(75,85,99,.2)', color:'#9CA3AF', border:'1px solid rgba(75,85,99,.3)' }}>SETTINGS</div>
        <h1 style={{ fontSize:24, fontWeight:700 }}>Studio Settings</h1>
        <p style={{ fontSize:13, color:'#6B7280', marginTop:2 }}>All changes are saved directly to Supabase</p>
      </div>

      {loading ? (
        <div style={{ color:'#4B5563', fontSize:14 }}>Loading settings…</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {SETTING_GROUPS.map(({ title, fields }) => (
            <div key={title} className="card" style={{ overflow:'hidden' }}>
              <div style={{ padding:'12px 18px', borderBottom:'1px solid #2D1F4E', fontSize:14, fontWeight:700, color:'#EAB308' }}>{title}</div>
              <div style={{ padding:18, display:'flex', flexDirection:'column', gap:14 }}>
                <div className="g2">
                  {fields.map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <input
                        style={inp}
                        placeholder={placeholder}
                        value={values[key] || ''}
                        onChange={e => set(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Owner credentials section */}
          <div className="card" style={{ overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid #2D1F4E', fontSize:14, fontWeight:700, color:'#EAB308' }}>Owner Login</div>
            <div style={{ padding:18 }}>
              <p style={{ fontSize:13, color:'#6B7280', marginBottom:14 }}>
                Default owner login: <span style={{ color:'#A78BFA', fontFamily:'monospace' }}>pentagonadmin</span> / <span style={{ color:'#A78BFA', fontFamily:'monospace' }}>1234567890</span>
              </p>
              <div className="g2">
                <div>
                  <label className="label">Admin Username</label>
                  <input style={inp} placeholder="pentagonadmin" value={values['admin_username'] || ''} onChange={e => set('admin_username', e.target.value)}/>
                </div>
                <div>
                  <label className="label">Admin Password</label>
                  <input style={inp} type="password" placeholder="••••••••" value={values['admin_password'] || ''} onChange={e => set('admin_password', e.target.value)}/>
                </div>
              </div>
              <p style={{ fontSize:11, color:'#4B5563', marginTop:8 }}>
                ⚠️ Changing these only updates studio_settings. To update login credentials, go to Staff and edit the employee directly.
              </p>
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="btn btn-primary"
            style={{ minHeight:48, fontSize:15, width:'100%', maxWidth:320 }}
          >
            {saved ? <><Check size={16}/> Saved!</> : saving ? 'Saving…' : 'Save All Settings'}
          </button>

          {saved && (
            <div style={{ padding:'10px 14px', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:10, color:'#34D399', fontSize:13 }}>
              ✓ All settings saved to Supabase successfully.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
