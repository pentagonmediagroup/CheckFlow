'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Check, Shield, Settings2, RefreshCw, Search, Filter, Trash2 } from 'lucide-react'

const SETTING_GROUPS = [
  {
    title: 'Studio Info',
    fields: [
      { key:'studio_name',   label:'Studio Name',    placeholder:'Pentagon Media Group' },
      { key:'location',      label:'Location',       placeholder:'Atlanta, GA' },
      { key:'contact_email', label:'Contact Email',  placeholder:'bookings@thepentagon.com' },
      { key:'phone',         label:'Phone',          placeholder:'404-000-0000' },
      { key:'instagram',     label:'Instagram',      placeholder:'@thepentagonmg' },
      { key:'website',       label:'Website',        placeholder:'https://thepentagon.com' },
    ],
  },
  {
    title: 'Session Defaults',
    fields: [
      { key:'default_studio',   label:'Default Studio',            placeholder:'Studio A' },
      { key:'default_duration', label:'Default Duration (minutes)', placeholder:'60' },
    ],
  },
]

const CATEGORY_COLORS: Record<string,string> = {
  auth:     '#A78BFA',
  session:  '#60A5FA',
  client:   '#F59E0B',
  staff:    '#34D399',
  task:     '#22D3EE',
  pipeline: '#C084FC',
  calendar: '#FB923C',
  settings: '#9CA3AF',
  cashflow: '#F87171',
  other:    '#6B7280',
}

const ACTION_COLORS: Record<string,string> = {
  LOGIN:        '#34D399',
  LOGIN_FAILED: '#F87171',
  LOGOUT:       '#9CA3AF',
  CREATE:       '#60A5FA',
  UPDATE:       '#F59E0B',
  DELETE:       '#F87171',
  VIEW:         '#6B7280',
}

type Tab = 'general' | 'audit'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const isOwner = user?.role === 'owner'
  const [tab, setTab] = useState<Tab>('general')

  // General settings
  const [values, setValues] = useState<Record<string,string>>({})
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Audit log
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => {
    supabase.from('studio_settings').select('key,value').then(({ data }) => {
      const map: Record<string,string> = {}
      ;(data||[]).forEach((r:any) => { map[r.key] = r.value||'' })
      setValues(map); setLoadingSettings(false)
    })
  }, [])

  const loadLogs = async () => {
    setLoadingLogs(true)
    let q = supabase.from('audit_log').select('*').order('created_at', { ascending:false }).limit(200)
    const { data } = await q
    setLogs(data||[])
    setLoadingLogs(false)
  }

  useEffect(() => { if (tab==='audit' && isOwner) loadLogs() }, [tab])

  const setVal = (k:string,v:string) => setValues(prev=>({...prev,[k]:v}))

  const save = async () => {
    setSaving(true)
    const upserts = Object.entries(values).map(([key,value])=>({ key, value, updated_at:new Date().toISOString() }))
    const { error } = await supabase.from('studio_settings').upsert(upserts, { onConflict:'key' })
    if (error) { alert('Error: '+error.message); setSaving(false); return }
    // Log to audit
    await supabase.from('audit_log').insert({ actor_username:user?.username||'unknown', actor_role:user?.role, action:'UPDATE', category:'settings', target_type:'studio_settings', target_name:'Studio Settings', detail:'Updated studio settings' })
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000)
  }

  const clearLog = async () => {
    if (!confirm('Clear all audit log entries? This cannot be undone.')) return
    await supabase.from('audit_log').delete().neq('id','00000000-0000-0000-0000-000000000000')
    setLogs([])
  }

  // Filter logs
  const filteredLogs = logs.filter(l => {
    const matchSearch = !search || [l.actor_username,l.action,l.target_name,l.detail,l.category].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()))
    const matchCat    = filterCat==='all' || l.category===filterCat
    const matchAction = filterAction==='all' || l.action===filterAction
    return matchSearch && matchCat && matchAction
  })

  const uniqueActions = [...new Set(logs.map(l=>l.action))]

  const inp = { background:'#0F0A1E', border:'1px solid #2D1F4E', borderRadius:12, padding:'11px 14px', fontSize:14, color:'#E8ECF4', width:'100%', outline:'none', fontFamily:'inherit' }

  const TabBtn = ({ id, label, icon }: { id:Tab, label:string, icon:React.ReactNode }) => (
    <button onClick={()=>setTab(id)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, fontSize:14, fontWeight:tab===id?700:500, cursor:'pointer', background:tab===id?'rgba(139,92,246,.2)':'transparent', color:tab===id?'#A78BFA':'#6B7280', border:`1px solid ${tab===id?'rgba(139,92,246,.4)':'transparent'}`, transition:'all .12s' }}>
      {icon}{label}
    </button>
  )

  return (
    <div className="page-pad">
      <div style={{ marginBottom:20 }}>
        <div className="page-badge" style={{ background:'rgba(75,85,99,.2)',color:'#9CA3AF',border:'1px solid rgba(75,85,99,.3)' }}>SETTINGS</div>
        <h1 style={{ fontSize:24,fontWeight:700 }}>Studio Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:24, borderBottom:'1px solid #2D1F4E', paddingBottom:12 }}>
        <TabBtn id="general" label="General" icon={<Settings2 size={14}/>}/>
        {isOwner && <TabBtn id="audit" label="Audit Log" icon={<Shield size={14}/>}/>}
      </div>

      {/* ── GENERAL TAB ── */}
      {tab==='general' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {loadingSettings ? <div style={{ color:'#4B5563' }}>Loading…</div> : (
            <>
              {SETTING_GROUPS.map(({ title, fields }) => (
                <div key={title} className="card" style={{ overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', borderBottom:'1px solid #2D1F4E', fontSize:14, fontWeight:700, color:'#EAB308' }}>{title}</div>
                  <div style={{ padding:18 }}>
                    <div className="g2">
                      {fields.map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="label">{label}</label>
                          <input style={inp} placeholder={placeholder} value={values[key]||''} onChange={e=>setVal(key,e.target.value)}/>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={save} disabled={saving} className="btn btn-primary" style={{ minHeight:48, fontSize:15, width:'100%', maxWidth:280 }}>
                {saved ? <><Check size={15}/> Saved!</> : saving ? 'Saving…' : 'Save All Settings'}
              </button>
              {saved && <div style={{ padding:'10px 14px', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:10, color:'#34D399', fontSize:13 }}>✓ Settings saved to Supabase.</div>}
            </>
          )}
        </div>
      )}

      {/* ── AUDIT LOG TAB ── */}
      {tab==='audit' && isOwner && (
        <div>
          {/* Toolbar */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200, position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#4B5563', pointerEvents:'none' }}/>
              <input style={{ ...inp, paddingLeft:36 }} placeholder="Search logs…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select style={{ ...inp, width:'auto', minWidth:130 }} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {['auth','session','client','staff','task','pipeline','calendar','settings','cashflow','other'].map(c=>(
                <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
            <select style={{ ...inp, width:'auto', minWidth:130 }} value={filterAction} onChange={e=>setFilterAction(e.target.value)}>
              <option value="all">All Actions</option>
              {uniqueActions.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={loadLogs} style={{ display:'flex',alignItems:'center',gap:5,padding:'10px 14px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:10,fontSize:13,cursor:'pointer' }}>
              <RefreshCw size={13}/> Refresh
            </button>
            <button onClick={clearLog} style={{ display:'flex',alignItems:'center',gap:5,padding:'10px 14px',background:'rgba(239,68,68,.08)',color:'#F87171',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,fontSize:13,cursor:'pointer' }}>
              <Trash2 size={13}/> Clear
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[
              { label:'Total Events',  value:logs.length },
              { label:'Logins',        value:logs.filter(l=>l.action==='LOGIN').length },
              { label:'Failed Logins', value:logs.filter(l=>l.action==='LOGIN_FAILED').length },
              { label:'Changes',       value:logs.filter(l=>['CREATE','UPDATE','DELETE'].includes(l.action)).length },
            ].map(({ label, value }) => (
              <div key={label} className="card" style={{ padding:'12px 14px' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>{value}</div>
                <div style={{ fontSize:11, color:'#4B5563', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Log table */}
          <div className="card" style={{ overflow:'hidden' }}>
            {loadingLogs ? (
              <div style={{ padding:40, textAlign:'center', color:'#4B5563' }}>Loading audit log…</div>
            ) : filteredLogs.length===0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#4B5563' }}>No log entries match your filters.</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid #2D1F4E' }}>
                      {['Timestamp','User','Action','Category','Target','Detail'].map(h=>(
                        <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, color:'#4B5563', fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => {
                      const actionColor = ACTION_COLORS[log.action] || '#9CA3AF'
                      const catColor    = CATEGORY_COLORS[log.category] || '#6B7280'
                      const ts = new Date(log.created_at)
                      const dateStr = ts.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                      const timeStr = ts.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
                      return (
                        <tr key={log.id} style={{ borderBottom:'1px solid #1A1F38' }}>
                          <td style={{ padding:'10px 14px', whiteSpace:'nowrap' }}>
                            <div style={{ fontSize:12, color:'#E8ECF4' }}>{dateStr}</div>
                            <div style={{ fontSize:10, color:'#4B5563', marginTop:1 }}>{timeStr}</div>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ fontSize:12, fontWeight:600, color:'#E8ECF4', fontFamily:'monospace' }}>@{log.actor_username}</div>
                            <div style={{ fontSize:10, color:log.actor_role==='owner'?'#EAB308':'#6B7280', marginTop:1, textTransform:'uppercase', letterSpacing:'.06em' }}>{log.actor_role}</div>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, fontWeight:700, background:`${actionColor}22`, color:actionColor, border:`1px solid ${actionColor}44`, letterSpacing:'.04em' }}>{log.action}</span>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, fontWeight:500, background:`${catColor}18`, color:catColor, border:`1px solid ${catColor}33`, textTransform:'capitalize' }}>{log.category}</span>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            {log.target_name && <div style={{ fontSize:12, color:'#D1D5DB' }}>{log.target_name}</div>}
                            {log.target_type && <div style={{ fontSize:10, color:'#4B5563', marginTop:1 }}>{log.target_type}</div>}
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:12, color:'#9CA3AF', maxWidth:220 }}>
                            <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={log.detail||''}>{log.detail||'—'}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop:10, fontSize:12, color:'#4B5563' }}>
            Showing {filteredLogs.length} of {logs.length} entries · Audit log captures login, logout, failed attempts, and all create/update/delete actions across the platform.
          </div>
        </div>
      )}
    </div>
  )
}
