'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Clock, MapPin, User, CreditCard, Package, DollarSign, Edit2, Tag } from 'lucide-react'

const PAY_OPTS = ['Balance Due','Deposit Paid','Paid in Full','Rescheduled','Late Fee Applied','Cancelled','Refunded']
const PAY_COLOR: Record<string,string> = {
  'Paid in Full':'#34D399','Deposit Paid':'#FCD34D','Balance Due':'#F87171',
  'Late Fee Applied':'#FB923C','Cancelled':'#6B7280','Rescheduled':'#60A5FA','Refunded':'#A78BFA',
}

// Non-Cash Services options
const NON_CASH_OPTS = [
  'Trade / Barter','Sponsorship Credit','Feature Exchange','Promotion Deal',
  'Studio Time Credit','Equity / Ownership','Merchandise','Other',
]

export default function SessionPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const [session,   setSession]   = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [editing,   setEditing]   = useState(false)
  const [edit,      setEdit]      = useState<any>({})

  useEffect(() => {
    Promise.all([
      supabase.from('sessions').select('*').eq('id', id as string).single(),
      supabase.from('employees').select('id,name').order('name'),
    ]).then(([{data:s},{data:e}]) => {
      setSession(s); setEdit(s||{}); setEmployees(e||[]); setLoading(false)
    })
  }, [id])

  const empName = (eid:string|null) => employees.find(e=>e.id===eid)?.name||null
  const setE    = (k:string, v:any) => setEdit((d:any)=>({...d,[k]:v}))

  const toggleNonCash = (opt: string) => {
    const current: string[] = edit.non_cash_services || []
    setE('non_cash_services', current.includes(opt) ? current.filter(x=>x!==opt) : [...current, opt])
  }

  const saveEdit = async () => {
    setSaving(true)
    const { error } = await supabase.from('sessions').update({
      payment_status:     edit.payment_status,
      total_amount:       parseFloat(edit.total_amount)||0,
      amount_paid:        parseFloat(edit.amount_paid)||0,
      late_fee:           parseFloat(edit.late_fee)||0,
      notes:              edit.notes,
      non_cash_services:  edit.non_cash_services || [],
    }).eq('id', id as string)
    if (error) { alert(error.message); setSaving(false); return }
    setSession({...session,...edit}); setEditing(false); setSaving(false)
  }

  const quickPatch = async (patch:any) => {
    await supabase.from('sessions').update(patch).eq('id', id as string)
    setSession((s:any)=>({...s,...patch}))
    setEdit((s:any)=>({...s,...patch}))
  }

  if (loading) return <div style={{ padding:40,color:'#4B5563' }}>Loading…</div>
  if (!session) return <div style={{ padding:40,color:'#4B5563' }}>Session not found. <Link href="/calendar" style={{ color:'#A78BFA' }}>← Back</Link></div>

  const balance    = (session.total_amount||0) - (session.amount_paid||0) + (session.late_fee||0)
  const dateStr    = session.start_time ? String(session.start_time).slice(0,10) : '—'
  const timeStr    = session.start_time ? String(session.start_time).slice(11,16) : '—'
  const nonCash    = session.non_cash_services || []
  const hasNonCash = nonCash.length > 0

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:10,padding:'9px 12px',fontSize:13,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }

  return (
    <div className="page-pad">
      <Link href="/calendar" style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:12,color:'#6B7280',textDecoration:'none',marginBottom:14 }}>
        <ArrowLeft size={13}/> Back to Calendar
      </Link>

      <div style={{ marginBottom:18 }}>
        <div className="page-badge" style={{ background:'rgba(139,92,246,.15)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)' }}>SESSION</div>
        <h1 style={{ fontSize:22,fontWeight:700 }}>{session.client_name||'Unnamed'}</h1>
        <p style={{ fontSize:13,color:'#6B7280',marginTop:2 }}>{session.service||session.session_type} · {session.studio}</p>

        {/* Payment status badge + Non-Cash badge */}
        <div style={{ display:'flex',gap:8,marginTop:8,flexWrap:'wrap' }}>
          {session.payment_status && (
            <span style={{ fontSize:12,padding:'4px 10px',borderRadius:6,fontWeight:600,
              background:`${PAY_COLOR[session.payment_status]||'#6B7280'}22`,
              color:PAY_COLOR[session.payment_status]||'#6B7280',
              border:`1px solid ${PAY_COLOR[session.payment_status]||'#6B7280'}44` }}>
              {session.payment_status}
            </span>
          )}
          {hasNonCash && (
            <span style={{ fontSize:12,padding:'4px 10px',borderRadius:6,fontWeight:600,background:'rgba(251,146,60,.12)',color:'#FB923C',border:'1px solid rgba(251,146,60,.3)',display:'flex',alignItems:'center',gap:5 }}>
              <Tag size={11}/> Non-Cash: {nonCash.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Session details */}
      <div className="card" style={{ overflow:'hidden',marginBottom:12 }}>
        {[
          { Icon:Clock,   label:'Date & Time',  value:`${dateStr} at ${timeStr}` },
          { Icon:MapPin,  label:'Studio',       value:session.studio },
          { Icon:User,    label:'Employee 1',   value:empName(session.employee_1_id) },
          { Icon:User,    label:'Employee 2',   value:empName(session.employee_2_id) },
          { Icon:User,    label:'Employee 3',   value:empName(session.employee_3_id) },
          { Icon:Package, label:'Deliverables', value:(session.deliverables||[]).join(', ')||null },
          { Icon:Clock,   label:'Deadline',     value:session.deadline||null },
        ].filter(r=>r.value).map(({Icon,label,value})=>(
          <div key={label} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid #1A1F38' }}>
            <div style={{ width:30,height:30,borderRadius:7,background:'#0C0F1E',border:'1px solid #1A1F38',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Icon size={13} style={{ color:'#6B7280' }}/>
            </div>
            <div>
              <div style={{ fontSize:10,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em' }}>{label}</div>
              <div style={{ fontSize:13,fontWeight:500,marginTop:1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment + Non-Cash Services */}
      <div className="card" style={{ padding:18,marginBottom:12 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <DollarSign size={14} style={{ color:'#EAB308' }}/>
            <span style={{ fontSize:14,fontWeight:600 }}>Payment & Deliverables</span>
          </div>
          <button onClick={()=>setEditing(v=>!v)} className="btn btn-ghost" style={{ minHeight:32,fontSize:12 }}>
            <Edit2 size={12}/>{editing?'Cancel':'Edit'}
          </button>
        </div>

        {editing ? (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <div className="g2">
              <div>
                <label className="label">Amount Paid ($)</label>
                <input style={inp} type="number" min="0" value={edit.amount_paid||''} onChange={e=>setE('amount_paid',e.target.value)}/>
              </div>
              <div>
                <label className="label">Total Amount ($)</label>
                <input style={inp} type="number" min="0" value={edit.total_amount||''} onChange={e=>setE('total_amount',e.target.value)}/>
              </div>
              <div>
                <label className="label">Late Fee ($)</label>
                <input style={inp} type="number" min="0" value={edit.late_fee||''} onChange={e=>setE('late_fee',e.target.value)}/>
              </div>
              {/* ── Payment Status (new field) ── */}
              <div>
                <label className="label">Payment Status</label>
                <select style={inp} value={edit.payment_status||''} onChange={e=>setE('payment_status',e.target.value)}>
                  {PAY_OPTS.map(s=><option key={s}>{s}</option>)}
                </select>
                <p style={{ fontSize:10,color:'#4B5563',marginTop:4 }}>Controls reporting and commission eligibility</p>
              </div>
            </div>

            {/* ── Non-Cash Services (new field) ── */}
            <div>
              <label className="label" style={{ display:'flex',alignItems:'center',gap:6 }}>
                <Tag size={11} style={{ color:'#FB923C' }}/> Non-Cash Services
                <span style={{ fontSize:10,color:'#4B5563',fontWeight:400 }}>— select all that apply</span>
              </label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:6 }}>
                {NON_CASH_OPTS.map(opt=>{
                  const sel = (edit.non_cash_services||[]).includes(opt)
                  return (
                    <button key={opt} onClick={()=>toggleNonCash(opt)}
                      style={{ padding:'5px 12px',borderRadius:20,fontSize:12,cursor:'pointer',
                        background:sel?'rgba(251,146,60,.18)':'rgba(255,255,255,.04)',
                        color:sel?'#FB923C':'#6B7280',
                        border:`1px solid ${sel?'rgba(251,146,60,.4)':'#2D1F4E'}`,
                        fontWeight:sel?600:400 }}>
                      {sel?'✓ ':''}{opt}
                    </button>
                  )
                })}
              </div>
              <p style={{ fontSize:10,color:'#4B5563',marginTop:6 }}>Non-cash services appear in reporting and history logs for accountability.</p>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea style={{ ...inp,resize:'vertical' as any }} rows={2} value={edit.notes||''} onChange={e=>setE('notes',e.target.value)}/>
            </div>
            <button onClick={saveEdit} disabled={saving} className="btn btn-primary" style={{ width:'100%',minHeight:42 }}>
              {saving?'Saving…':'✓ Save Changes'}
            </button>
          </div>
        ) : (
          <>
            {/* Payment amounts */}
            <div className="g3" style={{ marginBottom:14 }}>
              {[['Paid','#34D399',`$${(session.amount_paid||0).toFixed(2)}`],['Total Owed','#F87171',`$${(session.total_amount||0).toFixed(2)}`],['Balance','#EAB308',`$${balance.toFixed(2)}`]].map(([l,c,v])=>(
                <div key={String(l)} style={{ background:'#0C0F1E',border:'1px solid #1A1F38',borderRadius:10,padding:12,textAlign:'center' }}>
                  <div style={{ fontSize:10,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:20,fontWeight:700,color:String(c) }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Payment Status */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:hasNonCash?12:14,padding:'10px 12px',background:'#0C0F1E',border:'1px solid #1A1F38',borderRadius:10 }}>
              <div>
                <div style={{ fontSize:10,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3 }}>Payment Status</div>
                <span style={{ fontSize:13,padding:'4px 10px',borderRadius:6,fontWeight:600,
                  background:`${PAY_COLOR[session.payment_status]||'#6B7280'}22`,
                  color:PAY_COLOR[session.payment_status]||'#6B7280',
                  border:`1px solid ${PAY_COLOR[session.payment_status]||'#6B7280'}44` }}>
                  {session.payment_status||'—'}
                </span>
              </div>
              {session.payment_status==='Paid in Full' && (
                <div style={{ fontSize:11,color:'#34D399' }}>✓ Commission eligible</div>
              )}
            </div>

            {/* Non-Cash Services display */}
            {hasNonCash && (
              <div style={{ marginBottom:14,padding:'10px 12px',background:'rgba(251,146,60,.06)',border:'1px solid rgba(251,146,60,.2)',borderRadius:10 }}>
                <div style={{ fontSize:10,color:'#FB923C',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6,display:'flex',alignItems:'center',gap:5 }}>
                  <Tag size={10}/> Non-Cash Services
                </div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                  {nonCash.map((s:string)=>(
                    <span key={s} style={{ fontSize:12,padding:'3px 10px',borderRadius:20,background:'rgba(251,146,60,.12)',color:'#FB923C',border:'1px solid rgba(251,146,60,.25)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick action buttons */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:2 }}>
              {session.payment_status!=='Paid in Full' && (
                <button onClick={()=>quickPatch({payment_status:'Paid in Full',amount_paid:session.total_amount})} className="btn btn-success">✓ Mark Paid</button>
              )}
              <button onClick={()=>quickPatch({payment_status:'Rescheduled'})} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'0 12px',minHeight:38,background:'rgba(96,165,250,.12)',color:'#60A5FA',border:'1px solid rgba(96,165,250,.3)',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer' }}>↩ Reschedule</button>
              <button onClick={()=>quickPatch({payment_status:'Late Fee Applied',late_fee:(session.late_fee||0)+25})} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'0 12px',minHeight:38,background:'rgba(251,146,60,.1)',color:'#FB923C',border:'1px solid rgba(251,146,60,.3)',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer' }}>+ Late Fee ($25)</button>
              <button onClick={()=>{if(confirm('Cancel this session?'))quickPatch({payment_status:'Cancelled'})}} className="btn btn-danger">✕ Cancel Session</button>
            </div>
          </>
        )}
      </div>

      {session.notes && (
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:11,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6 }}>Notes</div>
          <div style={{ fontSize:13,color:'#9CA3AF',lineHeight:1.6 }}>{session.notes}</div>
        </div>
      )}
    </div>
  )
}
