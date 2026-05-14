'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { useAuth } from '@/components/AuthProvider'
import { AlertTriangle } from 'lucide-react'

const SERVICES = ['Recording Session','Mixing','Mastering','Vocal Booth','Band Rehearsal','Podcast','Photography','Video Production','Interview']
const DEADLINES = ['24-48 hrs','3-5 days','1 week','2 weeks','ASAP']
const PAY_OPTS = ['Balance Due','Deposit Paid','Paid in Full','Rescheduled','Late Fee Applied','Cancelled']
const DELIVERABLES = ['Full Mix','Stems','Video','Social Clips','Thumbnails','Audio Bounce','Photo Selects','Interview','Other']

// Color per studio
const STUDIO_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'Studio A': { bg:'linear-gradient(135deg,#6B21A8,#4C1D95)', border:'#6B21A8', text:'#EAB308', badge:'rgba(107,33,168,.2)' },
  'Studio B': { bg:'linear-gradient(135deg,#0E7490,#0C4A6E)', border:'#0891B2', text:'#22D3EE', badge:'rgba(8,145,178,.2)' },
}

export default function BookPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [pipelines, setPipelines] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [conflict, setConflict] = useState<any>(null)
  const [checking, setChecking] = useState(false)

  const [form, setForm] = useState({
    client_name:'', phone:'', email:'', ig:'',
    studio:'Studio A', service:'Recording Session',
    date:'', start_time:'', duration:60,
    emp1:'', emp2:'', emp3:'', salesperson_id:'',
    deliverables:[] as string[], deadline:'24-48 hrs',
    payment_status:'Balance Due',
    amount_paid:0, total_amount:0, late_fee:0,
    reschedule_date:'', notes:'', pipeline_id:'', pipeline_name:'Default',
  })

  useEffect(() => {
    supabase.from('employees').select('id,name,role,app_role').order('name').then(({data})=>setEmployees(data||[]))
    supabase.from('clients').select('id,name').order('name').then(({data})=>setClients(data||[]))
    supabase.from('pipelines').select('id,name').order('name').then(({data})=>setPipelines(data||[]))
  }, [])

  const set = (k:string, v:any) => setForm(f=>({...f,[k]:v}))
  const toggleDel = (d:string) => set('deliverables', form.deliverables.includes(d)?form.deliverables.filter(x=>x!==d):[...form.deliverables,d])

  const balance = form.total_amount - form.amount_paid + form.late_fee

  // Check for studio conflict whenever studio/date/time/duration changes
  const checkConflict = async (studio:string, date:string, start:string, duration:number) => {
    if (!date || !start) { setConflict(null); return }
    setChecking(true)
    const startTs = `${date}T${start}:00`
    const [ch, cm] = start.split(':').map(Number)
    const cMins = ch * 60 + (cm || 0) + duration
    const cEndH = String(Math.floor(cMins / 60) % 24).padStart(2,'0')
    const cEndM = String(cMins % 60).padStart(2,'0')
    const endTs = `${date}T${cEndH}:${cEndM}:00`
    const { data } = await supabase.rpc('check_studio_conflict', {
      p_studio: studio, p_start: startTs, p_end: endTs
    })
    setConflict(data && data.length > 0 ? data[0] : null)
    setChecking(false)
  }

  const handleFieldChange = (k:string, v:any) => {
    const updated = {...form,[k]:v}
    set(k,v)
    checkConflict(
      k==='studio'?v:updated.studio,
      k==='date'?v:updated.date,
      k==='start_time'?v:updated.start_time,
      k==='duration'?v:updated.duration
    )
  }

  const handleSubmit = async () => {
    if (!form.client_name.trim() || !form.date || !form.start_time) return
    if (conflict) return // block if conflict exists
    setSaving(true)
    try {
      let clientId: string|null = null
      const existing = clients.find(c=>c.name.toLowerCase()===form.client_name.toLowerCase().trim())
      if (existing) {
        clientId = existing.id
      } else {
        const {data} = await supabase.from('clients').insert({ name:form.client_name.trim(), email:form.email, phone:form.phone, ig:form.ig, salesperson_id:form.salesperson_id||null }).select('id').single()
        clientId = data?.id||null
      }
      const startTs = `${form.date}T${form.start_time}:00`
      // Compute end time without UTC conversion to avoid timezone shift
      const [sh, sm] = form.start_time.split(':').map(Number)
      const startMinutes = sh * 60 + (sm || 0) + form.duration
      const endH = String(Math.floor(startMinutes / 60) % 24).padStart(2,'0')
      const endM = String(startMinutes % 60).padStart(2,'0')
      const endTs = `${form.date}T${endH}:${endM}:00`

      const {data:session, error} = await supabase.from('sessions').insert({
        client_id:form.client_name.trim()?clientId:null,
        client_name:form.client_name.trim(),
        session_type:form.service, service:form.service,
        studio:form.studio, date:form.date,
        start_time:startTs, end_time:endTs,
        total_amount:form.total_amount, amount_owed:form.total_amount,
        amount_paid:form.amount_paid, late_fee:form.late_fee,
        payment_status:form.payment_status,
        deliverables:form.deliverables, deadline:form.deadline,
        employee_1_id:form.emp1||null, employee_2_id:form.emp2||null, employee_3_id:form.emp3||null,
        salesperson_id:form.salesperson_id||null, notes:form.notes,
      }).select('id').single()
      if (error) throw error

      const emps = [form.emp1,form.emp2,form.emp3].filter(Boolean)
      if (emps.length) await supabase.from('session_employees').insert(emps.map(eid=>({ session_id:session!.id, employee_id:eid })))

      await supabase.from('tasks').insert({ session_id:session!.id, client_name:form.client_name.trim(), task_type:form.service, stage:'Setup', status:'Setup', pipeline_name:'Default', assigned_to:form.emp1||null })

      // Single calendar event
      await supabase.from('calendar_events').insert({
        title:`${form.client_name.trim()} – ${form.service}`,
        description:form.notes,
        start_time:startTs, end_time:endTs,
        event_type:'Session',
        studio:form.studio,
        session_id:session!.id,
        date:form.date,
        color:form.studio==='Studio A'?'#8B5CF6':'#06B6D4',
        assigned_to:form.emp1||null,
      })

      await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'CREATE', category:'session', target_type:'session', target_name:form.client_name.trim(), detail:`Booked ${form.service} in ${form.studio} for ${form.client_name.trim()} on ${form.date}` })

      setSaved(true)
      setTimeout(()=>router.push('/dashboard'),1400)
    } catch(e:any) {
      alert('Error saving: '+(e.message||e))
    } finally { setSaving(false) }
  }

  if (saved) return (
    <div style={{ padding:'80px 24px',textAlign:'center' }}>
      <div style={{ fontSize:48,marginBottom:12 }}>⚡</div>
      <h2 style={{ fontSize:22,fontWeight:700,color:'#E8ECF4' }}>Session Booked!</h2>
      <p style={{ color:'#6B7280',marginTop:6 }}>Saved · Task created · Calendar updated</p>
    </div>
  )

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:12,padding:'11px 14px',fontSize:14,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }
  const sc = STUDIO_COLORS[form.studio]

  return (
    <div className="page-pad">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24,fontWeight:700,color:'#fff' }}>Book a Session</h1>
        <p style={{ color:'#9CA3AF',marginTop:4,fontSize:13 }}>Saves to Supabase · Creates task & calendar event</p>
      </div>

      {/* Studio conflict banner */}
      {conflict && (
        <div style={{ marginBottom:16,padding:'14px 16px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.35)',borderRadius:12,display:'flex',alignItems:'flex-start',gap:10 }}>
          <AlertTriangle size={18} style={{ color:'#F87171',flexShrink:0,marginTop:1 }}/>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:'#F87171' }}>⚠️ {form.studio} is already booked at this time</div>
            <div style={{ fontSize:13,color:'#FCA5A5',marginTop:3 }}>
              <strong>{conflict.client_name}</strong> has {form.studio} from{' '}
              <strong>{String(conflict.start_time).slice(11,16)}</strong> to{' '}
              <strong>{String(conflict.end_time).slice(11,16)}</strong> · Status: {conflict.payment_status}
            </div>
            <div style={{ fontSize:12,color:'#9CA3AF',marginTop:4 }}>Change the studio, date, or time to continue.</div>
          </div>
        </div>
      )}

      <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
        {/* Client Info */}
        <div className="card" style={{ padding:20 }}>
          <div className="section-title">Client Information</div>
          <div className="g2">
            <div><label className="label">Client Name *</label><input style={inp} placeholder="Full name" value={form.client_name} onChange={e=>set('client_name',e.target.value)} list="cl-list" autoFocus/><datalist id="cl-list">{clients.map(c=><option key={c.id} value={c.name}/>)}</datalist></div>
            <div><label className="label">Phone</label><input style={inp} placeholder="404-000-0000" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
            <div><label className="label">Email</label><input style={inp} type="email" placeholder="client@email.com" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
            <div><label className="label">Instagram</label><input style={inp} placeholder="@handle" value={form.ig} onChange={e=>set('ig',e.target.value)}/></div>
          </div>
        </div>

        {/* Session Details */}
        <div className="card" style={{ padding:20 }}>
          <div className="section-title">Session Details</div>

          {/* Studio selector with color coding */}
          <label className="label" style={{ marginBottom:8 }}>Studio *</label>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
            {Object.entries(STUDIO_COLORS).map(([studio,colors])=>{
              const active = form.studio===studio
              return (
                <button key={studio} type="button" onClick={()=>handleFieldChange('studio',studio)}
                  style={{ padding:14,borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',border:`2px solid ${active?colors.border:'#2D1F4E'}`,transition:'all .15s',
                    background:active?colors.bg:'#0F0A1E',color:active?colors.text:'#6B7280',
                    boxShadow:active?`0 0 20px ${colors.border}55`:'none' }}>
                  <div style={{ fontSize:16,marginBottom:2 }}>{studio}</div>
                  <div style={{ fontSize:10,opacity:.8,fontWeight:400 }}>{checking?'checking…':conflict&&form.studio===studio?'⚠️ Conflict':'Available'}</div>
                </button>
              )
            })}
          </div>

          <div className="g2">
            <div><label className="label">Service *</label><select style={inp} value={form.service} onChange={e=>set('service',e.target.value)}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="label">Date *</label><input style={inp} type="date" value={form.date} onChange={e=>handleFieldChange('date',e.target.value)}/></div>
            <div><label className="label">Start Time *</label><input style={inp} type="time" step="3600" value={form.start_time} onChange={e=>handleFieldChange('start_time',e.target.value)}/></div>
            <div><label className="label">Duration</label>
              <select style={inp} value={form.duration} onChange={e=>handleFieldChange('duration',parseInt(e.target.value))}>
                {[30,60,90,120,180,240,300,360].map(m=><option key={m} value={m}>{m<60?`${m}m`:`${m/60}h`}</option>)}
              </select>
            </div>
            <div><label className="label">Employee 1</label><select style={inp} value={form.emp1} onChange={e=>set('emp1',e.target.value)}><option value="">— Select —</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}{e.role?` · ${e.role}`:''}</option>)}</select></div>
            <div><label className="label">Employee 2</label><select style={inp} value={form.emp2} onChange={e=>set('emp2',e.target.value)}><option value="">— Select —</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}{e.role?` · ${e.role}`:''}</option>)}</select></div>
            <div><label className="label">Employee 3</label><select style={inp} value={form.emp3} onChange={e=>set('emp3',e.target.value)}><option value="">— Select —</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}{e.role?` · ${e.role}`:''}</option>)}</select></div>
            <div><label className="label">Salesperson (commission)</label><select style={inp} value={form.salesperson_id} onChange={e=>set('salesperson_id',e.target.value)}><option value="">— Select —</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
            <div><label className="label">Task Pipeline</label><select style={inp} value={form.pipeline_id} onChange={e=>{
              const sel = pipelines.find(p=>p.id===e.target.value)
              set('pipeline_id', e.target.value)
              set('pipeline_name', sel?.name||'Default')
            }}><option value="">Default</option>{pipelines.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </div>
        </div>

        {/* Deliverables & Payment */}
        <div className="card" style={{ padding:20 }}>
          <div className="section-title">Deliverables & Payment</div>
          <label className="label" style={{ marginBottom:8 }}>Deliverables</label>
          <div className="g3" style={{ marginBottom:18 }}>
            {DELIVERABLES.map(d=>(
              <label key={d} style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'10px 12px',borderRadius:10,background:'#0F0A1E',border:`1px solid ${form.deliverables.includes(d)?'#6B21A8':'#2D1F4E'}`,transition:'border .1s' }}>
                <input type="checkbox" checked={form.deliverables.includes(d)} onChange={()=>toggleDel(d)} style={{ width:15,height:15,accentColor:'#8B5CF6',flexShrink:0 }}/>
                <span style={{ fontSize:13,color:'#E8ECF4' }}>{d}</span>
              </label>
            ))}
          </div>
          <div className="g2">
            <div><label className="label">Deadline</label><select style={inp} value={form.deadline} onChange={e=>set('deadline',e.target.value)}>{DEADLINES.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="label">Payment Status</label><select style={inp} value={form.payment_status} onChange={e=>set('payment_status',e.target.value)}>{PAY_OPTS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="label">Amount Paid ($) — enter first</label><input style={inp} type="number" min="0" placeholder="0.00" value={form.amount_paid||''} onChange={e=>set('amount_paid',parseFloat(e.target.value)||0)}/></div>
            <div><label className="label">Total Amount</label><input style={inp} type="number" min="0" placeholder="0.00" value={form.total_amount||''} onChange={e=>set('total_amount',parseFloat(e.target.value)||0)}/></div>
            <div><label className="label">Late Fee ($)</label><input style={inp} type="number" min="0" placeholder="0.00" value={form.late_fee||''} onChange={e=>set('late_fee',parseFloat(e.target.value)||0)}/></div>
            <div><label className="label">Reschedule Date</label><input style={inp} type="date" value={form.reschedule_date} onChange={e=>set('reschedule_date',e.target.value)}/></div>
          </div>
          {(form.total_amount>0||form.amount_paid>0) && (
            <div style={{ marginTop:14,padding:'14px 16px',background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:12,display:'flex',gap:24,flexWrap:'wrap' }}>
              {[['Paid','#34D399',`$${form.amount_paid.toFixed(2)}`],['Total Amount','#F87171',`$${form.total_amount.toFixed(2)}`],['Balance','#EAB308',`$${Math.abs(balance).toFixed(2)}`]].map(([l,c,v])=>(
                <div key={String(l)}>
                  <div style={{ fontSize:9,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.08em' }}>{l}</div>
                  <div style={{ fontSize:20,fontWeight:700,color:String(c) }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding:20 }}>
          <label className="label">Notes</label>
          <textarea rows={3} style={{ ...inp,resize:'vertical' as any }} placeholder="Session notes..." value={form.notes} onChange={e=>set('notes',e.target.value)}/>
        </div>

        <button onClick={handleSubmit}
          disabled={saving||!form.client_name.trim()||!form.date||!form.start_time||!!conflict}
          className="btn btn-primary"
          style={{ width:'100%',minHeight:50,fontSize:16,opacity:(conflict||saving)?0.5:1,cursor:conflict?'not-allowed':'pointer' }}>
          {saving?'Booking…':conflict?'⚠️ Resolve Conflict to Book':'⚡ Book Session'}
        </button>
      </div>
    </div>
  )
}
