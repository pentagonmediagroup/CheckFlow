'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { DollarSign, TrendingUp, AlertCircle, Users, ChevronDown, Edit2, Check, X } from 'lucide-react'

const PAY_OPTS = ['Balance Due','Deposit Paid','Paid in Full','Rescheduled','Late Fee Applied','Cancelled','Refunded']
const PAY_COLOR: Record<string,string> = {
  'Paid in Full':'#34D399','Deposit Paid':'#FCD34D','Balance Due':'#F87171',
  'Late Fee Applied':'#FB923C','Cancelled':'#6B7280','Rescheduled':'#60A5FA','Refunded':'#A78BFA',
}
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface EditRow { id:string; payment_status:string; amount_paid:number; total_amount:number; late_fee:number }

export default function CashflowPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [sessions,    setSessions]    = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [editRow, setEditRow] = useState<EditRow|null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('id,client_name,service,session_type,start_time,date,payment_status,total_amount,amount_paid,late_fee,salesperson:employees!sessions_salesperson_id_fkey(id,name)')
      .order('start_time', { ascending:false })
    const rows = data||[]
    setSessions(rows)
    // Commission rollup
    const map: Record<string,{name:string;sales:number;commission:number}> = {}
    rows.forEach((r:any) => {
      if (r.salesperson && r.payment_status==='Paid in Full') {
        const id = r.salesperson.id
        if (!map[id]) map[id]={ name:r.salesperson.name, sales:0, commission:0 }
        map[id].sales      += r.amount_paid||0
        map[id].commission += (r.amount_paid||0)*0.25
      }
    })
    setCommissions(Object.values(map))
    setLoading(false)
  }

  useEffect(() => {
    if (user && user.role!=='owner') { router.replace('/dashboard'); return }
    fetchSessions()

    // Realtime subscription — auto-refresh sessions on any update
    const channel = supabase.channel('cashflow-sessions')
      .on('postgres_changes', { event:'*', schema:'public', table:'sessions' }, () => {
        fetchSessions()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Month options from session dates
  const monthOptions = useMemo(() => {
    const seen = new Set<string>()
    sessions.forEach(s => { const m=String(s.start_time||s.date||'').slice(0,7); if(m.length===7) seen.add(m) })
    return Array.from(seen).sort().reverse()
  }, [sessions])

  const filtered = useMemo(() => {
    if (selectedMonth==='all') return sessions
    return sessions.filter(s=>String(s.start_time||s.date||'').slice(0,7)===selectedMonth)
  }, [sessions,selectedMonth])

  const kpi = useMemo(() => ({
    invoiced:    filtered.reduce((s,r)=>s+(r.total_amount||0),0),
    collected:   filtered.reduce((s,r)=>s+(r.amount_paid||0),0),
    outstanding: filtered.reduce((s,r)=>s+Math.max(0,(r.total_amount||0)-(r.amount_paid||0)+(r.late_fee||0)),0),
    lateFees:    filtered.reduce((s,r)=>s+(r.late_fee||0),0),
    sessions:    filtered.length,
  }), [filtered])

  const monthlySummary = useMemo(() => {
    if (selectedMonth!=='all') return []
    const map: Record<string,{label:string;invoiced:number;collected:number;count:number}> = {}
    sessions.forEach(s => {
      const m=String(s.start_time||s.date||'').slice(0,7); if(m.length!==7) return
      if (!map[m]) { const [y,mo]=m.split('-'); map[m]={ label:`${MONTH_NAMES[parseInt(mo)-1]} ${y}`,invoiced:0,collected:0,count:0 } }
      map[m].invoiced+=s.total_amount||0; map[m].collected+=s.amount_paid||0; map[m].count+=1
    })
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v)
  }, [sessions,selectedMonth])

  const maxBar = Math.max(...monthlySummary.map(m=>m.invoiced),1)
  const fmtMonth = (ym:string) => { const [y,m]=ym.split('-'); return `${MONTH_NAMES[parseInt(m)-1]} ${y}` }

  // Start editing a row
  const startEdit = (s:any) => setEditRow({ id:s.id, payment_status:s.payment_status||'Balance Due', amount_paid:s.amount_paid||0, total_amount:s.total_amount||0, late_fee:s.late_fee||0 })

  // Save edit back to Supabase — triggers realtime → dashboard auto-updates
  const saveEdit = async () => {
    if (!editRow) return
    setSavingEdit(true)
    const { error } = await supabase.from('sessions').update({
      payment_status: editRow.payment_status,
      amount_paid:    editRow.amount_paid,
      total_amount:   editRow.total_amount,
      late_fee:       editRow.late_fee,
      updated_at:     new Date().toISOString(),
    }).eq('id', editRow.id)
    if (error) { alert('Error: '+error.message); setSavingEdit(false); return }
    // Optimistic update
    setSessions(prev => prev.map(s => s.id===editRow.id ? { ...s, ...editRow } : s))
    setEditRow(null); setSavingEdit(false)
  }

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:8,padding:'5px 8px',fontSize:12,color:'#E8ECF4',outline:'none',fontFamily:'inherit',width:'100%' }

  if (user?.role!=='owner') return null

  return (
    <div className="page-pad">
      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(16,185,129,.12)',color:'#34D399',border:'1px solid rgba(16,185,129,.25)' }}>CASHFLOW · OWNER ONLY</div>
          <h1 style={{ fontSize:24,fontWeight:700 }}>Financial Overview</h1>
          <p style={{ fontSize:13,color:'#6B7280',marginTop:2 }}>Revenue, collections & 25% commission · Click pencil to edit any session</p>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ position:'relative' }}>
            <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}
              style={{ background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:12,padding:'10px 36px 10px 14px',fontSize:14,color:'#E8ECF4',outline:'none',fontFamily:'inherit',minWidth:160,appearance:'none',cursor:'pointer',fontWeight:600 }}>
              <option value="all">All Time</option>
              {monthOptions.map(m=><option key={m} value={m}>{fmtMonth(m)}</option>)}
            </select>
            <ChevronDown size={14} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'#6B7280',pointerEvents:'none' }}/>
          </div>
          {selectedMonth!=='all' && (
            <button onClick={()=>setSelectedMonth('all')} style={{ padding:'8px 12px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:8,fontSize:12,cursor:'pointer' }}>← All Time</button>
          )}
        </div>
      </div>

      {selectedMonth!=='all' && (
        <div style={{ marginBottom:14,padding:'10px 16px',background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:14,fontWeight:700,color:'#A78BFA' }}>{fmtMonth(selectedMonth)}</span>
          <span style={{ fontSize:12,color:'#6B7280' }}>{kpi.sessions} session{kpi.sessions!==1?'s':''}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="g4" style={{ marginBottom:20 }}>
        {[
          { label:'Total Invoiced', value:`$${kpi.invoiced.toFixed(2)}`,    Icon:DollarSign,  c:'#A78BFA',bg:'rgba(139,92,246,.12)',b:'rgba(139,92,246,.2)' },
          { label:'Collected',      value:`$${kpi.collected.toFixed(2)}`,   Icon:TrendingUp,  c:'#34D399', bg:'rgba(16,185,129,.12)',b:'rgba(16,185,129,.2)' },
          { label:'Outstanding',    value:`$${kpi.outstanding.toFixed(2)}`, Icon:AlertCircle, c:kpi.outstanding>0?'#F87171':'#34D399',bg:'rgba(239,68,68,.1)',b:'rgba(239,68,68,.2)' },
          { label:'Late Fees',      value:`$${kpi.lateFees.toFixed(2)}`,    Icon:DollarSign,  c:'#FB923C', bg:'rgba(251,146,60,.1)',b:'rgba(251,146,60,.2)' },
        ].map(({ label,value,Icon,c,bg,b })=>(
          <div key={label} className="card" style={{ padding:14 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:bg,border:`1px solid ${b}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10 }}><Icon size={14} style={{ color:c }}/></div>
            <div style={{ fontSize:22,fontWeight:700,color:'#fff' }}>{loading?'…':value}</div>
            <div style={{ fontSize:11,color:'#4B5563',marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart + summary — all time only */}
      {selectedMonth==='all' && monthlySummary.length>0 && (
        <div className="card" style={{ padding:20,marginBottom:18 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <h2 style={{ fontSize:14,fontWeight:700 }}>Monthly Breakdown</h2>
            <div style={{ display:'flex',gap:14 }}>
              {[['Invoiced','rgba(139,92,246,.5)'],['Collected','#10B981']].map(([l,col])=>(
                <div key={l} style={{ display:'flex',alignItems:'center',gap:5 }}>
                  <div style={{ width:10,height:10,borderRadius:2,background:col }}/>
                  <span style={{ fontSize:11,color:'#6B7280' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'flex-end',height:100,marginBottom:6 }}>
            {monthlySummary.map((m,i)=>(
              <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',cursor:'pointer' }}
                onClick={()=>{ const ym=monthOptions[monthOptions.length-1-i]; if(ym) setSelectedMonth(ym) }}>
                <div style={{ width:'100%',display:'flex',gap:2,alignItems:'flex-end',height:'100%',justifyContent:'center' }}>
                  <div style={{ flex:1,height:`${Math.round((m.invoiced/maxBar)*100)}%`,background:'rgba(139,92,246,.4)',borderRadius:'3px 3px 0 0',minHeight:3 }}/>
                  <div style={{ flex:1,height:`${Math.round((m.collected/maxBar)*100)}%`,background:'#10B981',borderRadius:'3px 3px 0 0',minHeight:3 }}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex',gap:8,marginBottom:14 }}>
            {monthlySummary.map((m,i)=>(
              <div key={i} style={{ flex:1,textAlign:'center',fontSize:9,color:'#4B5563',overflow:'hidden',whiteSpace:'nowrap' }}>{m.label.split(' ')[0]}</div>
            ))}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            {[...monthlySummary].reverse().slice(0,6).map((m,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:8,cursor:'pointer' }}
                onClick={()=>{ const ym=monthOptions.find(mo=>fmtMonth(mo)===m.label); if(ym) setSelectedMonth(ym) }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(139,92,246,.4)')}
                onMouseLeave={e=>(e.currentTarget.style.borderColor='#2D1F4E')}>
                <span style={{ fontSize:13,fontWeight:600,minWidth:90 }}>{m.label}</span>
                <span style={{ fontSize:11,color:'#4B5563' }}>{m.count} session{m.count!==1?'s':''}</span>
                <div style={{ display:'flex',gap:16 }}>
                  {[['Invoiced','#A78BFA',m.invoiced],['Collected','#34D399',m.collected],['Balance',(m.invoiced-m.collected)>0?'#F87171':'#34D399',m.invoiced-m.collected]].map(([l,col,v])=>(
                    <div key={String(l)} style={{ textAlign:'right' }}>
                      <div style={{ fontSize:9,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em' }}>{l}</div>
                      <div style={{ fontSize:13,fontWeight:600,color:String(col) }}>${Number(v).toFixed(0)}</div>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize:11,color:'#A78BFA' }}>View →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commission table */}
      {commissions.length>0 && selectedMonth==='all' && (
        <div className="card" style={{ overflow:'hidden',marginBottom:16 }}>
          <div style={{ padding:'11px 16px',borderBottom:'1px solid #2D1F4E',display:'flex',alignItems:'center',gap:8 }}>
            <Users size={13} style={{ color:'#EAB308' }}/>
            <span style={{ fontSize:13,fontWeight:600 }}>Sales Commissions</span>
            <span style={{ fontSize:11,color:'#6B7280' }}>25% of paid-in-full</span>
          </div>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:'1px solid #1A1F38' }}>
              {['Salesperson','Total Sales','Commission Owed'].map(h=>(
                <th key={h} style={{ padding:'8px 16px',textAlign:'left',fontSize:10,color:'#4B5563',fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {commissions.map((c,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #1A1F38' }}>
                  <td style={{ padding:'12px 16px',fontSize:13,fontWeight:600 }}>{c.name}</td>
                  <td style={{ padding:'12px 16px',fontSize:13,color:'#34D399' }}>${c.sales.toFixed(2)}</td>
                  <td style={{ padding:'12px 16px',fontSize:14,fontWeight:700,color:'#EAB308' }}>${c.commission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sessions table — owner can edit inline */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'11px 16px',borderBottom:'1px solid #2D1F4E',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
          <span style={{ fontSize:13,fontWeight:600 }}>
            {selectedMonth==='all'?'All Sessions':`Sessions — ${fmtMonth(selectedMonth)}`}
          </span>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:12,color:'#6B7280' }}>{filtered.length} record{filtered.length!==1?'s':''}</span>
            <span style={{ fontSize:12,color:'#6B7280' }}>Collected: <span style={{ color:'#34D399',fontWeight:600 }}>${kpi.collected.toFixed(2)}</span></span>
            <span style={{ fontSize:11,color:'#A78BFA',display:'flex',alignItems:'center',gap:4 }}><Edit2 size={11}/> Click pencil to edit</span>
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',minWidth:780 }}>
            <thead><tr style={{ borderBottom:'1px solid #1A1F38' }}>
              {['Client','Service','Date','Invoiced','Paid','Balance','Status',''].map(h=>(
                <th key={h} style={{ padding:'8px 14px',textAlign:'left',fontSize:10,color:'#4B5563',fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0&&!loading&&(
                <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#4B5563' }}>
                  {selectedMonth==='all'?'No sessions yet':`No sessions in ${fmtMonth(selectedMonth)}`}
                </td></tr>
              )}
              {filtered.map(s=>{
                const isEditing = editRow?.id===s.id
                const dispPaid   = isEditing ? editRow!.amount_paid   : (s.amount_paid||0)
                const dispTotal  = isEditing ? editRow!.total_amount  : (s.total_amount||0)
                const dispLate   = isEditing ? editRow!.late_fee      : (s.late_fee||0)
                const dispStatus = isEditing ? editRow!.payment_status: (s.payment_status||'—')
                const bal = dispTotal - dispPaid + dispLate
                const dateStr = s.start_time?String(s.start_time).slice(0,10):s.date||'—'

                return (
                  <tr key={s.id} style={{ borderBottom:'1px solid #1A1F38',background:isEditing?'rgba(139,92,246,.04)':'transparent' }}>
                    <td style={{ padding:'11px 14px',fontSize:13,fontWeight:600 }}>{s.client_name||'—'}</td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'#6B7280' }}>{s.service||s.session_type||'—'}</td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'#6B7280',whiteSpace:'nowrap' }}>{dateStr}</td>

                    {/* Editable fields */}
                    <td style={{ padding:'6px 10px',minWidth:100 }}>
                      {isEditing
                        ? <input style={inp} type="number" min="0" value={editRow!.total_amount} onChange={e=>setEditRow(r=>r?{...r,total_amount:parseFloat(e.target.value)||0}:r)}/>
                        : <span style={{ fontSize:13 }}>${dispTotal.toFixed(2)}</span>}
                    </td>
                    <td style={{ padding:'6px 10px',minWidth:100 }}>
                      {isEditing
                        ? <input style={inp} type="number" min="0" value={editRow!.amount_paid} onChange={e=>setEditRow(r=>r?{...r,amount_paid:parseFloat(e.target.value)||0}:r)}/>
                        : <span style={{ fontSize:13,color:'#34D399' }}>${dispPaid.toFixed(2)}</span>}
                    </td>
                    <td style={{ padding:'11px 14px',fontSize:13,fontWeight:700,color:bal>0?'#F87171':'#34D399' }}>
                      ${Math.abs(bal).toFixed(2)}
                    </td>
                    <td style={{ padding:'6px 10px',minWidth:140 }}>
                      {isEditing
                        ? <select style={inp} value={editRow!.payment_status} onChange={e=>setEditRow(r=>r?{...r,payment_status:e.target.value}:r)}>
                            {PAY_OPTS.map(o=><option key={o}>{o}</option>)}
                          </select>
                        : <span style={{ fontSize:11,padding:'3px 8px',borderRadius:6,fontWeight:500,background:`${PAY_COLOR[dispStatus]||'#6B7280'}22`,color:PAY_COLOR[dispStatus]||'#6B7280',border:`1px solid ${PAY_COLOR[dispStatus]||'#6B7280'}44`,whiteSpace:'nowrap' }}>{dispStatus}</span>}
                    </td>
                    <td style={{ padding:'6px 10px',whiteSpace:'nowrap' }}>
                      {isEditing ? (
                        <div style={{ display:'flex',gap:4 }}>
                          <button onClick={saveEdit} disabled={savingEdit}
                            style={{ display:'flex',alignItems:'center',gap:3,padding:'4px 10px',background:'rgba(16,185,129,.15)',color:'#34D399',border:'1px solid rgba(16,185,129,.3)',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:600 }}>
                            <Check size={11}/>{savingEdit?'…':'Save'}
                          </button>
                          <button onClick={()=>setEditRow(null)}
                            style={{ padding:'4px 8px',background:'rgba(255,255,255,.05)',color:'#6B7280',border:'1px solid #2D1F4E',borderRadius:6,fontSize:12,cursor:'pointer' }}>
                            <X size={11}/>
                          </button>
                        </div>
                      ) : (
                        <button onClick={()=>startEdit(s)}
                          style={{ width:28,height:28,background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.2)',borderRadius:6,color:'#A78BFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
                          title="Edit session">
                          <Edit2 size={12}/>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
