'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Check, Shield, Settings2, RefreshCw, Search, Trash2, Clock, History, Download, ChevronLeft, ChevronRight } from 'lucide-react'

const SETTING_GROUPS = [
  { title:'Studio Info', fields:[
    { key:'studio_name',   label:'Studio Name',    placeholder:'The Pentagon' },
    { key:'location',      label:'Location',       placeholder:'Atlanta, GA' },
    { key:'contact_email', label:'Contact Email',  placeholder:'bookings@thepentagon.com' },
    { key:'phone',         label:'Phone',          placeholder:'404-000-0000' },
    { key:'instagram',     label:'Instagram',      placeholder:'@thepentagonmg' },
    { key:'website',       label:'Website',        placeholder:'https://thepentagon.com' },
  ]},
  { title:'Session Defaults', fields:[
    { key:'default_studio',      label:'Default Studio',                   placeholder:'Studio A' },
    { key:'default_duration',    label:'Default Duration (minutes)',        placeholder:'60' },
    { key:'archive_after_days',  label:'Archive Done Tasks After (days)',   placeholder:'30' },
  ]},
]

const ACTION_COLORS: Record<string,string> = {
  LOGIN:'#34D399', LOGIN_FAILED:'#F87171', LOGOUT:'#9CA3AF',
  CREATE:'#60A5FA', UPDATE:'#F59E0B', DELETE:'#F87171', APPROVE:'#34D399',
  SOP_STARTED:'#22D3EE', SOP_STEP:'#A78BFA', SOP_STEP_SKIP:'#FB923C',
  SOP_COMPLETED:'#34D399',
}
const CAT_COLORS: Record<string,string> = {
  auth:'#A78BFA', session:'#60A5FA', client:'#F59E0B', staff:'#34D399',
  task:'#22D3EE', pipeline:'#C084FC', calendar:'#FB923C', settings:'#9CA3AF',
  cashflow:'#F87171', other:'#6B7280',
}

type Tab = 'general' | 'history' | 'audit' | 'autosignout'
const PAGE_SIZE_OPTS = [10, 25, 50]

export default function SettingsPage() {
  const { user } = useAuth()
  const router   = useRouter()

  useEffect(() => {
    if (user && user.role !== 'owner') router.replace('/dashboard')
  }, [user])

  const [tab,              setTab]              = useState<Tab>('general')
  const [values,           setValues]           = useState<Record<string,string>>({})
  const [loadingSettings,  setLoadingSettings]  = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [saved,            setSaved]            = useState(false)
  const [logs,             setLogs]             = useState<any[]>([])
  const [loadingLogs,      setLoadingLogs]      = useState(false)
  const [search,           setSearch]           = useState('')
  const [filterCat,        setFilterCat]        = useState('all')
  const [filterAction,     setFilterAction]     = useState('all')
  const [history,          setHistory]          = useState<any[]>([])
  const [loadingHistory,   setLoadingHistory]   = useState(false)
  const [histSearch,       setHistSearch]       = useState('')

  // ── Pagination state ──────────────────────────────────────
  const [auditPage,     setAuditPage]     = useState(1)
  const [auditPageSize, setAuditPageSize] = useState(25)

  useEffect(() => {
    supabase.from('studio_settings').select('key,value').then(({ data }) => {
      const map: Record<string,string> = {}
      ;(data||[]).forEach((r:any) => { map[r.key] = r.value||'' })
      setValues(map); setLoadingSettings(false)
    })
  }, [])

  const loadLogs = async () => {
    setLoadingLogs(true)
    const { data } = await supabase.from('audit_log').select('*').order('created_at',{ascending:false}).limit(1000)
    setLogs(data||[]); setLoadingLogs(false)
  }
  const loadHistory = async () => {
    setLoadingHistory(true)
    const { data } = await supabase.from('history_log').select('*').order('archived_at',{ascending:false}).limit(500)
    setHistory(data||[]); setLoadingHistory(false)
  }

  useEffect(() => { if (tab==='audit')   loadLogs()    }, [tab])
  useEffect(() => { if (tab==='history') loadHistory() }, [tab])

  // Reset to page 1 when filters change
  useEffect(() => { setAuditPage(1) }, [search, filterCat, filterAction])

  const setVal = (k:string,v:string) => setValues(prev=>({...prev,[k]:v}))

  const save = async () => {
    setSaving(true)
    const upserts = Object.entries(values).map(([key,value])=>({ key,value,updated_at:new Date().toISOString() }))
    const { error } = await supabase.from('studio_settings').upsert(upserts,{onConflict:'key'})
    if (error) { alert('Error: '+error.message); setSaving(false); return }
    await supabase.from('audit_log').insert({ actor_username:user?.username||'unknown', actor_role:user?.role, action:'UPDATE', category:'settings', target_name:'Studio Settings', detail:'Updated studio settings' })
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000)
  }

  const saveAutoSignout = async () => {
    const secs = parseInt(values['auto_signout_seconds']||'0')
    await supabase.from('studio_settings').upsert({ key:'auto_signout_seconds', value:String(secs), updated_at:new Date().toISOString() },{ onConflict:'key' })
    setSaved(true); setTimeout(()=>setSaved(false),2000)
  }

  const exportCSV = () => {
    const rows = filteredHistory
    const headers = ['type','client','date','service','studio','amount_paid','amount_owed','payment_status','deliverables','archived_at']
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
      const v = r[h==='type'?'record_type':h==='date'?'session_date':h]
      if (Array.isArray(v)) return `"${v.join('; ')}"`
      return `"${String(v||'').replace(/"/g,'""')}"`
    }).join(','))].join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='studioflow-history.csv'; a.click()
  }

  const exportXLSX = () => {
    const rows = filteredHistory
    const headers = ['Type','Client','Date','Service','Studio','Paid','Owed','Status','Deliverables','Archived']
    const tsv = [headers.join('\t'), ...rows.map(r => [
      r.record_type||'',r.client_name||'',r.session_date||'',r.service||'',r.studio||'',
      r.amount_paid||0,r.amount_owed||0,r.payment_status||'',
      (r.deliverables||[]).join('; '),r.archived_at||''
    ].join('\t'))].join('\n')
    const blob = new Blob([tsv],{type:'application/vnd.ms-excel'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='studioflow-history.xls'; a.click()
  }

  const filteredLogs = useMemo(() =>
    logs.filter(l => {
      const s = !search || [l.actor_username,l.action,l.target_name,l.detail,l.category].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()))
      const cat = filterCat==='all' || l.category===filterCat
      const act = filterAction==='all' || l.action===filterAction
      return s && cat && act
    }),
  [logs, search, filterCat, filterAction])

  const filteredHistory = useMemo(() =>
    history.filter(h => !histSearch || [h.client_name,h.service,h.payment_status,h.task_pipeline].some(v=>String(v||'').toLowerCase().includes(histSearch.toLowerCase()))),
  [history, histSearch])

  const uniqueActions = useMemo(() => [...new Set(logs.map(l=>l.action))], [logs])

  // ── Paginated audit logs ──────────────────────────────────
  const totalAuditPages = Math.max(1, Math.ceil(filteredLogs.length / auditPageSize))
  const safePage        = Math.min(auditPage, totalAuditPages)
  const auditStart      = (safePage - 1) * auditPageSize
  const auditEnd        = Math.min(auditStart + auditPageSize, filteredLogs.length)
  const pagedLogs       = filteredLogs.slice(auditStart, auditEnd)

  // Build page number list (max 7 shown)
  const pageNumbers = useMemo(() => {
    const pages: (number|'...')[] = []
    if (totalAuditPages <= 7) {
      for (let i=1; i<=totalAuditPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push('...')
      for (let i=Math.max(2,safePage-1); i<=Math.min(totalAuditPages-1,safePage+1); i++) pages.push(i)
      if (safePage < totalAuditPages - 2) pages.push('...')
      pages.push(totalAuditPages)
    }
    return pages
  }, [totalAuditPages, safePage])

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:12,padding:'11px 14px',fontSize:14,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }
  const TabBtn = ({ id, label, icon }: {id:Tab,label:string,icon:React.ReactNode}) => (
    <button onClick={()=>setTab(id)} style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,fontSize:13,fontWeight:tab===id?700:500,cursor:'pointer',background:tab===id?'rgba(139,92,246,.2)':'transparent',color:tab===id?'#A78BFA':'#6B7280',border:`1px solid ${tab===id?'rgba(139,92,246,.4)':'transparent'}`,transition:'all .12s' }}>
      {icon}{label}
    </button>
  )

  if (user?.role !== 'owner') return null

  return (
    <div className="page-pad">
      <div style={{ marginBottom:20 }}>
        <div className="page-badge" style={{ background:'rgba(75,85,99,.2)',color:'#9CA3AF',border:'1px solid rgba(75,85,99,.3)' }}>SETTINGS · OWNER ONLY</div>
        <h1 style={{ fontSize:24,fontWeight:700 }}>Studio Settings</h1>
        <p style={{ fontSize:12,color:'#4B5563',marginTop:2 }}>StudioFlow platform configuration</p>
      </div>

      <div style={{ display:'flex',gap:4,marginBottom:22,borderBottom:'1px solid #2D1F4E',paddingBottom:10,flexWrap:'wrap' }}>
        <TabBtn id="general"     label="General"       icon={<Settings2 size={13}/>}/>
        <TabBtn id="history"     label="History Log"   icon={<History size={13}/>}/>
        <TabBtn id="audit"       label="Audit Log"     icon={<Shield size={13}/>}/>
        <TabBtn id="autosignout" label="Auto Sign-Out" icon={<Clock size={13}/>}/>
      </div>

      {/* ── GENERAL ── */}
      {tab==='general' && (
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {loadingSettings ? <div style={{ color:'#4B5563' }}>Loading…</div> : (
            <>
              {SETTING_GROUPS.map(({ title,fields }) => (
                <div key={title} className="card" style={{ overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px',borderBottom:'1px solid #2D1F4E',fontSize:14,fontWeight:700,color:'#EAB308' }}>{title}</div>
                  <div style={{ padding:18 }}>
                    <div className="g2">{fields.map(({ key,label,placeholder }) => (
                      <div key={key}>
                        <label className="label">{label}</label>
                        <input style={inp} placeholder={placeholder} value={values[key]||''} onChange={e=>setVal(key,e.target.value)}/>
                      </div>
                    ))}</div>
                  </div>
                </div>
              ))}
              <button onClick={save} disabled={saving} className="btn btn-primary" style={{ minHeight:48,fontSize:15,width:'100%',maxWidth:280 }}>
                {saved?<><Check size={15}/> Saved!</>:saving?'Saving…':'Save All Settings'}
              </button>
              {saved&&<div style={{ padding:'10px 14px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.25)',borderRadius:10,color:'#34D399',fontSize:13 }}>✓ Saved to Supabase.</div>}
            </>
          )}
        </div>
      )}

      {/* ── HISTORY LOG ── */}
      {tab==='history' && (
        <div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8 }}>
            <div>
              <h2 style={{ fontSize:16,fontWeight:700 }}>History Log</h2>
              <p style={{ fontSize:12,color:'#4B5563',marginTop:2 }}>36-month rolling archive · {history.length} records</p>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:'rgba(6,182,212,.1)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)',borderRadius:8,fontSize:12,cursor:'pointer' }}><Download size={13}/> CSV</button>
              <button onClick={exportXLSX} style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:'rgba(16,185,129,.1)',color:'#34D399',border:'1px solid rgba(16,185,129,.25)',borderRadius:8,fontSize:12,cursor:'pointer' }}><Download size={13}/> XLSX</button>
              <button onClick={loadHistory} style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 12px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:8,fontSize:12,cursor:'pointer' }}><RefreshCw size={13}/></button>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#4B5563',pointerEvents:'none' }}/>
              <input style={{ ...inp,paddingLeft:34,fontSize:13 }} placeholder="Search client, service, status…" value={histSearch} onChange={e=>setHistSearch(e.target.value)}/>
            </div>
          </div>
          {loadingHistory ? <div style={{ padding:40,textAlign:'center',color:'#4B5563' }}>Loading…</div> : (
            <div className="card" style={{ overflow:'hidden' }}>
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',minWidth:800 }}>
                  <thead><tr style={{ borderBottom:'1px solid #2D1F4E' }}>
                    {['Type','Client','Date','Service','Studio','Paid','Status','Deliverables','Archived'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px',textAlign:'left',fontSize:10,color:'#4B5563',fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredHistory.length===0&&!loadingHistory&&<tr><td colSpan={9} style={{ padding:40,textAlign:'center',color:'#4B5563' }}>No history yet.</td></tr>}
                    {filteredHistory.map(r=>(
                      <tr key={r.id} style={{ borderBottom:'1px solid #1A1F38' }}>
                        <td style={{ padding:'10px 12px' }}><span style={{ fontSize:10,padding:'2px 7px',borderRadius:4,background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)' }}>{r.record_type}</span></td>
                        <td style={{ padding:'10px 12px',fontSize:12,fontWeight:600 }}>{r.client_name||'—'}</td>
                        <td style={{ padding:'10px 12px',fontSize:11,color:'#6B7280',whiteSpace:'nowrap' }}>{r.session_date||'—'}</td>
                        <td style={{ padding:'10px 12px',fontSize:12,color:'#9CA3AF' }}>{r.service||r.task_pipeline||'—'}</td>
                        <td style={{ padding:'10px 12px',fontSize:12,color:'#9CA3AF' }}>{r.studio||'—'}</td>
                        <td style={{ padding:'10px 12px',fontSize:12,color:'#34D399' }}>${(r.amount_paid||0).toFixed(2)}</td>
                        <td style={{ padding:'10px 12px' }}><span style={{ fontSize:10,padding:'2px 7px',borderRadius:4,background:'rgba(16,185,129,.08)',color:'#34D399',border:'1px solid rgba(16,185,129,.2)',whiteSpace:'nowrap' }}>{r.payment_status||r.task_stage||'—'}</span></td>
                        <td style={{ padding:'10px 12px',fontSize:11,color:'#6B7280',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{(r.deliverables||[]).join(', ')||'—'}</td>
                        <td style={{ padding:'10px 12px',fontSize:10,color:'#4B5563',whiteSpace:'nowrap' }}>{r.archived_at?new Date(r.archived_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AUDIT LOG ── */}
      {tab==='audit' && (
        <div>
          {/* Filters row */}
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap' }}>
            <div style={{ flex:1,minWidth:200,position:'relative' }}>
              <Search size={13} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#4B5563',pointerEvents:'none' }}/>
              <input style={{ ...inp,paddingLeft:34 }} placeholder="Search logs…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select style={{ ...inp,width:'auto',minWidth:130 }} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {['auth','session','client','staff','task','pipeline','calendar','settings','cashflow','other'].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
            <select style={{ ...inp,width:'auto',minWidth:130 }} value={filterAction} onChange={e=>setFilterAction(e.target.value)}>
              <option value="all">All Actions</option>
              {uniqueActions.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={loadLogs} style={{ display:'flex',alignItems:'center',gap:5,padding:'10px 12px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:10,fontSize:12,cursor:'pointer' }}><RefreshCw size={13}/></button>
            <button onClick={async()=>{ if(!confirm('Clear all audit logs?'))return; await supabase.from('audit_log').delete().neq('id','00000000-0000-0000-0000-000000000000'); setLogs([]) }} style={{ display:'flex',alignItems:'center',gap:5,padding:'10px 12px',background:'rgba(239,68,68,.08)',color:'#F87171',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,fontSize:12,cursor:'pointer' }}><Trash2 size={13}/></button>
          </div>

          {/* KPI cards */}
          <div className="g4" style={{ marginBottom:14 }}>
            {[
              { l:'Total Events', value:filteredLogs.length },
              { l:'Logins',       value:filteredLogs.filter(l=>l.action==='LOGIN').length },
              { l:'Failed',       value:filteredLogs.filter(l=>l.action==='LOGIN_FAILED').length },
              { l:'SOP Actions',  value:filteredLogs.filter(l=>l.action?.startsWith('SOP')).length },
            ].map(({ l,value })=>(
              <div key={l} className="card" style={{ padding:'12px 14px' }}>
                <div style={{ fontSize:22,fontWeight:700,color:'#fff' }}>{value}</div>
                <div style={{ fontSize:11,color:'#4B5563',marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card" style={{ overflow:'hidden' }}>
            {loadingLogs ? (
              <div style={{ padding:40,textAlign:'center',color:'#4B5563' }}>Loading…</div>
            ) : filteredLogs.length===0 ? (
              <div style={{ padding:40,textAlign:'center',color:'#4B5563' }}>No entries match.</div>
            ) : (
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',minWidth:700 }}>
                  <thead><tr style={{ borderBottom:'1px solid #2D1F4E' }}>
                    {['Timestamp','User','Action','Category','Target','Detail'].map(h=>(
                      <th key={h} style={{ padding:'8px 14px',textAlign:'left',fontSize:10,color:'#4B5563',fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {pagedLogs.map(log=>{
                      const ac = ACTION_COLORS[log.action]||'#9CA3AF'
                      const cc = CAT_COLORS[log.category]||'#6B7280'
                      const ts = new Date(log.created_at)
                      return (
                        <tr key={log.id} style={{ borderBottom:'1px solid #1A1F38' }}>
                          <td style={{ padding:'10px 14px',whiteSpace:'nowrap' }}>
                            <div style={{ fontSize:12 }}>{ts.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                            <div style={{ fontSize:10,color:'#4B5563',marginTop:1 }}>{ts.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ fontSize:12,fontWeight:600,fontFamily:'monospace' }}>@{log.actor_username}</div>
                            <div style={{ fontSize:10,color:log.actor_role==='owner'?'#EAB308':'#6B7280',marginTop:1,textTransform:'uppercase',letterSpacing:'.06em' }}>{log.actor_role}</div>
                          </td>
                          <td style={{ padding:'10px 14px' }}><span style={{ fontSize:11,padding:'3px 8px',borderRadius:6,fontWeight:700,background:`${ac}22`,color:ac,border:`1px solid ${ac}44` }}>{log.action}</span></td>
                          <td style={{ padding:'10px 14px' }}><span style={{ fontSize:11,padding:'3px 8px',borderRadius:6,background:`${cc}18`,color:cc,border:`1px solid ${cc}33`,textTransform:'capitalize' }}>{log.category}</span></td>
                          <td style={{ padding:'10px 14px' }}>
                            {log.target_name&&<div style={{ fontSize:12,color:'#D1D5DB' }}>{log.target_name}</div>}
                            {log.target_type&&<div style={{ fontSize:10,color:'#4B5563',marginTop:1 }}>{log.target_type}</div>}
                          </td>
                          <td style={{ padding:'10px 14px',fontSize:12,color:'#9CA3AF',maxWidth:200 }}>
                            <div style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }} title={log.detail||''}>{log.detail||'—'}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Pagination controls ── */}
          {filteredLogs.length > 0 && (
            <div style={{ marginTop:14,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
              {/* Left: showing text + page size */}
              <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                <span style={{ fontSize:12,color:'#6B7280' }}>
                  Showing <span style={{ color:'#E8ECF4',fontWeight:600 }}>{filteredLogs.length===0?0:auditStart+1}–{auditEnd}</span> of <span style={{ color:'#E8ECF4',fontWeight:600 }}>{filteredLogs.length}</span> records
                </span>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <span style={{ fontSize:11,color:'#4B5563' }}>Per page:</span>
                  {PAGE_SIZE_OPTS.map(size=>(
                    <button key={size} onClick={()=>{ setAuditPageSize(size); setAuditPage(1) }}
                      style={{ padding:'3px 10px',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:auditPageSize===size?700:400,
                        background:auditPageSize===size?'rgba(139,92,246,.2)':'rgba(255,255,255,.04)',
                        color:auditPageSize===size?'#A78BFA':'#6B7280',
                        border:`1px solid ${auditPageSize===size?'rgba(139,92,246,.4)':'#2D1F4E'}` }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: page navigator */}
              <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                {/* Prev */}
                <button onClick={()=>setAuditPage(p=>Math.max(1,p-1))} disabled={safePage===1}
                  style={{ width:32,height:32,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',cursor:safePage===1?'default':'pointer',
                    background:'rgba(255,255,255,.04)',border:'1px solid #2D1F4E',color:safePage===1?'#2D1F4E':'#9CA3AF',transition:'all .12s' }}>
                  <ChevronLeft size={14}/>
                </button>

                {/* Page numbers */}
                {pageNumbers.map((p,i)=>
                  p==='...' ? (
                    <span key={`dots-${i}`} style={{ padding:'0 4px',color:'#4B5563',fontSize:12 }}>…</span>
                  ) : (
                    <button key={p} onClick={()=>setAuditPage(p as number)}
                      style={{ width:32,height:32,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13,fontWeight:p===safePage?700:400,
                        background:p===safePage?'rgba(139,92,246,.2)':'rgba(255,255,255,.04)',
                        color:p===safePage?'#A78BFA':'#9CA3AF',
                        border:`1px solid ${p===safePage?'rgba(139,92,246,.4)':'#2D1F4E'}` }}>
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button onClick={()=>setAuditPage(p=>Math.min(totalAuditPages,p+1))} disabled={safePage===totalAuditPages}
                  style={{ width:32,height:32,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',cursor:safePage===totalAuditPages?'default':'pointer',
                    background:'rgba(255,255,255,.04)',border:'1px solid #2D1F4E',color:safePage===totalAuditPages?'#2D1F4E':'#9CA3AF',transition:'all .12s' }}>
                  <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AUTO SIGN-OUT ── */}
      {tab==='autosignout' && (
        <div style={{ maxWidth:560 }}>
          <div className="card" style={{ padding:24 }}>
            <h2 style={{ fontSize:16,fontWeight:700,color:'#EAB308',marginBottom:6 }}>Auto Sign-Out</h2>
            <p style={{ fontSize:13,color:'#6B7280',marginBottom:20 }}>Automatically sign out employees (non-owners) after a period of inactivity. Set to 0 to disable.</p>
            <div className="g2" style={{ marginBottom:16 }}>
              <div>
                <label className="label">Timeout (seconds)</label>
                <input style={inp} type="number" min="0" placeholder="0 = disabled" value={values['auto_signout_seconds']||''} onChange={e=>setVal('auto_signout_seconds',e.target.value)}/>
                <p style={{ fontSize:11,color:'#4B5563',marginTop:4 }}>e.g. 300 = 5 min · 1800 = 30 min · 3600 = 1 hr</p>
              </div>
              <div style={{ display:'flex',flexDirection:'column',justifyContent:'center' }}>
                {[60,300,900,1800,3600].map(s=>(
                  <button key={s} onClick={()=>setVal('auto_signout_seconds',String(s))} style={{ marginBottom:4,padding:'6px 12px',background:values['auto_signout_seconds']===String(s)?'rgba(139,92,246,.2)':'rgba(255,255,255,.04)',color:values['auto_signout_seconds']===String(s)?'#A78BFA':'#6B7280',border:`1px solid ${values['auto_signout_seconds']===String(s)?'rgba(139,92,246,.3)':'#2D1F4E'}`,borderRadius:8,fontSize:12,cursor:'pointer',textAlign:'left' }}>
                    {s < 60 ? `${s}s` : `${s/60} min${s/60>1?'s':''}`} ({s}s)
                  </button>
                ))}
                <button onClick={()=>setVal('auto_signout_seconds','0')} style={{ padding:'6px 12px',background:'rgba(239,68,68,.06)',color:'#F87171',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,fontSize:12,cursor:'pointer' }}>Disable (0)</button>
              </div>
            </div>
            <button onClick={saveAutoSignout} className="btn btn-primary" style={{ minHeight:44 }}>
              {saved?'✓ Saved!':'Save Auto Sign-Out'}
            </button>
            <p style={{ fontSize:11,color:'#4B5563',marginTop:10 }}>Applies to all Employees and Contractors. Owners are never auto-signed out. Timer resets on any mouse, keyboard, or touch activity.</p>
          </div>
        </div>
      )}
    </div>
  )
}
