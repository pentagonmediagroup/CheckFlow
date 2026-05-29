'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Plus, X, ChevronLeft, ChevronRight, Clock, MapPin, User, Edit2, Save, CalendarX, RefreshCw } from 'lucide-react'

const SERVICES = ['Recording Session','Mixing','Mastering','Vocal Booth','Band Rehearsal','Podcast','Photography','Video Production','Interview']
const EVENT_TYPES = ['General','Meeting','Rehearsal','Maintenance','Blocked','Holiday','Other']
const CANCEL_REASONS = ['Client No Show','Client Cancelled','Studio Unavailable','Emergency','Weather','Other']
const TYPE_COLORS: Record<string,string> = {
  General:'#8B5CF6', Meeting:'#06B6D4', Rehearsal:'#F59E0B',
  Maintenance:'#F87171', Blocked:'#4B5563', Holiday:'#10B981', Other:'#6B7280', Session:'#8B5CF6',
}
const STUDIO_COLOR: Record<string,string> = {
  'Studio A':'#8B5CF6', 'Studio B':'#06B6D4', 'Both':'#F59E0B',
}

const pad = (n:number) => String(n).padStart(2,'0')
const daysInMonth = (y:number,m:number) => new Date(y,m+1,0).getDate()
const firstDay    = (y:number,m:number) => new Date(y,m,1).getDay()

const fmtTime = (ts:string) => {
  if (!ts) return ''
  const m = String(ts).match(/[T ](\d{2}):(\d{2})/)
  if (!m) return ''
  let h = parseInt(m[1]), min = m[2], ampm = 'AM'
  if (h >= 12) { ampm = 'PM'; if (h > 12) h -= 12 }
  if (h === 0) h = 12
  return `${h}:${min} ${ampm}`
}

const fmtDate = (ts:string) => {
  if (!ts) return ''
  const dm = String(ts).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!dm) return ''
  return new Date(parseInt(dm[1]), parseInt(dm[2])-1, parseInt(dm[3]))
    .toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})
}

const extractDate = (ts:string) => ts ? String(ts).slice(0,10) : ''
const extractTime = (ts:string) => { const m = String(ts).match(/[T ](\d{2}:\d{2})/); return m?m[1]:'' }

interface PopoutEvent { item:any; x:number; y:number }
interface DayModal  { date:string; items:any[] }

export default function CalendarPage() {
  const now = new Date()
  const { user } = useAuth()
  const canEdit = user?.role==='owner'||user?.role==='executive_assistant'||user?.app_role==='owner'

  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events,    setEvents]    = useState<any[]>([])
  const [sessions,  setSessions]  = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [popout,    setPopout]    = useState<PopoutEvent|null>(null)
  const [dayModal,  setDayModal]  = useState<DayModal|null>(null)   // "+N more" expanded day
  const [editModal, setEditModal] = useState<any|null>(null)
  const [editForm,  setEditForm]  = useState<any>({})
  const [editSaving,setEditSaving]= useState(false)
  // Cancel/reschedule state
  const [actionModal,   setActionModal]   = useState<{type:'cancel'|'reschedule', session:any}|null>(null)
  const [cancelReason,  setCancelReason]  = useState('Client Cancelled')
  const [cancelNote,    setCancelNote]    = useState('')
  const [reschedDate,   setReschedDate]   = useState('')
  const [reschedStart,  setReschedStart]  = useState('')
  const [reschedEnd,    setReschedEnd]    = useState('')
  const [actionSaving,  setActionSaving]  = useState(false)
  const popoutRef = useRef<HTMLDivElement>(null)

  const blank = { title:'', date:'', start_time:'', end_time:'', event_type:'General', studio:'N/A', assigned_to:'', description:'' }
  const [form, setForm] = useState<any>(blank)

  const load = async () => {
    const from = `${year}-${pad(month+1)}-01`
    const to   = `${year}-${pad(month+1)}-${pad(daysInMonth(year,month))}`
    const [{ data:ev }, { data:se }, { data:em }] = await Promise.all([
      supabase.from('calendar_events').select('*').gte('date',from).lte('date',to).order('start_time'),
      supabase.from('sessions').select('id,client_name,session_type,service,start_time,end_time,date,studio,payment_status,cancelled_at,cancellation_reason,employee_1_id,employee_2_id,employee_3_id,notes').gte('date',from).lte('date',to).order('date'),
      supabase.from('employees').select('id,name').order('name'),
    ])
    setEvents(ev||[])
    setSessions(se||[])
    setEmployees(em||[])
  }

  useEffect(() => { load() }, [year,month])

  useEffect(() => {
    const h = (e:MouseEvent) => {
      if (popout && popoutRef.current && !popoutRef.current.contains(e.target as Node)) setPopout(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [popout])

  const setF  = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}))
  const setEF = (k:string,v:any) => setEditForm((f:any)=>({...f,[k]:v}))

  // ── Save new calendar event ──
  const save = async () => {
    if (!form.title.trim()||!form.date||!form.start_time) return
    setSaving(true)
    const startTs = `${form.date}T${form.start_time}:00`
    const endTs   = form.end_time ? `${form.date}T${form.end_time}:00` : startTs
    const { error } = await supabase.from('calendar_events').insert({
      title:form.title.trim(), description:form.description,
      start_time:startTs, end_time:endTs,
      event_type:form.event_type, studio:form.studio||'N/A',
      assigned_to:form.assigned_to||null,
      color:TYPE_COLORS[form.event_type]||'#8B5CF6', date:form.date,
    })
    if (error) { alert('Error: '+error.message); setSaving(false); return }
    setForm(blank); setShowForm(false); setSaving(false); load()
  }

  // ── Open edit modal ──
  const openEditSession = (session:any) => {
    setPopout(null); setDayModal(null)
    setEditForm({
      id: session.id, client_name: session.client_name||'',
      service: session.service||session.session_type||'Recording Session',
      studio:  session.studio||'Studio A',
      date:    session.date ? String(session.date).slice(0,10) : extractDate(session.start_time),
      start_time: extractTime(session.start_time||''),
      end_time:   extractTime(session.end_time||''),
      employee_1_id: session.employee_1_id||'',
      employee_2_id: session.employee_2_id||'',
      employee_3_id: session.employee_3_id||'',
      notes: session.notes||'',
    })
    setEditModal(session)
  }

  // ── Save edits ──
  const saveEditSession = async () => {
    if (!editForm.date||!editForm.start_time) return
    setEditSaving(true)
    try {
      const startTs = `${editForm.date}T${editForm.start_time}:00`
      const endTs   = editForm.end_time ? `${editForm.date}T${editForm.end_time}:00` : startTs
      const { error } = await supabase.from('sessions').update({
        service: editForm.service, session_type: editForm.service,
        studio: editForm.studio, date: editForm.date,
        start_time: startTs, end_time: endTs,
        employee_1_id: editForm.employee_1_id||null,
        employee_2_id: editForm.employee_2_id||null,
        employee_3_id: editForm.employee_3_id||null,
        notes: editForm.notes, updated_at: new Date().toISOString(),
      }).eq('id', editForm.id)
      if (error) throw error
      await supabase.from('calendar_events').update({
        title: `${editForm.client_name} – ${editForm.service}`,
        start_time: startTs, end_time: endTs,
        studio: editForm.studio, date: editForm.date,
        color: editForm.studio==='Studio A'?'#8B5CF6':'#06B6D4',
        assigned_to: editForm.employee_1_id||null, description: editForm.notes,
      }).eq('session_id', editForm.id)
      await supabase.from('audit_log').insert({
        actor_username: user?.username||'system', actor_role: user?.role||'owner',
        action:'UPDATE', category:'session', target_type:'session',
        target_name: editForm.client_name,
        detail: `Updated booking: ${editForm.service} in ${editForm.studio} on ${editForm.date}`,
      })
      setEditModal(null); load()
    } catch(e:any) { alert('Error: '+(e.message||e)) }
    finally { setEditSaving(false) }
  }

  // ── Open cancel/reschedule ──
  const openAction = (type:'cancel'|'reschedule', session:any) => {
    setPopout(null); setDayModal(null)
    setCancelReason('Client Cancelled'); setCancelNote('')
    setReschedDate(''); setReschedStart(extractTime(session.start_time||'')); setReschedEnd(extractTime(session.end_time||''))
    setActionModal({ type, session })
  }

  // ── Confirm cancel ──
  const confirmCancel = async () => {
    if (!actionModal) return
    setActionSaving(true)
    const { session } = actionModal
    try {
      await supabase.from('sessions').update({
        cancelled_at: new Date().toISOString(), cancellation_reason: cancelReason,
        payment_cancelled_at: new Date().toISOString(), cancellation_reason: cancelReason,
        notes: [session.notes, `CANCELLED: ${cancelReason}${cancelNote?` — ${cancelNote}`:''}`].filter(Boolean).join('\n'),
        updated_at: new Date().toISOString(),
      }).eq('id', session.id)
      await supabase.from('calendar_events').update({
        title: `❌ ${session.client_name} – ${session.service||session.session_type} (Cancelled)`,
        color: '#4B5563',
        description: `Cancelled: ${cancelReason}${cancelNote?` — ${cancelNote}`:''}`,
      }).eq('session_id', session.id)
      await supabase.from('audit_log').insert({
        actor_username: user?.username||'system', actor_role: user?.role||'owner',
        action:'CANCEL', category:'session', target_type:'session',
        target_name: session.client_name,
        detail: `Cancelled booking: ${cancelReason}${cancelNote?` — ${cancelNote}`:''}`,
      })
      setActionModal(null); load()
    } catch(e:any) { alert('Error: '+(e.message||e)) }
    finally { setActionSaving(false) }
  }

  // ── Confirm reschedule ──
  const confirmReschedule = async () => {
    if (!actionModal||!reschedDate||!reschedStart) return
    setActionSaving(true)
    const { session } = actionModal
    try {
      const newStart = `${reschedDate}T${reschedStart}:00`
      const newEnd   = reschedEnd ? `${reschedDate}T${reschedEnd}:00` : newStart
      await supabase.from('sessions').update({
        date: reschedDate, start_time: newStart, end_time: newEnd,
        payment_status: 'Rescheduled',
        notes: [session.notes, `RESCHEDULED to ${reschedDate} at ${reschedStart} by ${user?.username||'system'}`].filter(Boolean).join('\n'),
        updated_at: new Date().toISOString(),
      }).eq('id', session.id)
      await supabase.from('calendar_events').update({
        title: `🔄 ${session.client_name} – ${session.service||session.session_type}`,
        start_time: newStart, end_time: newEnd, date: reschedDate,
        color: session.studio==='Studio A'?'#8B5CF6':'#06B6D4',
        description: `Rescheduled from ${extractDate(session.start_time)}`,
      }).eq('session_id', session.id)
      await supabase.from('audit_log').insert({
        actor_username: user?.username||'system', actor_role: user?.role||'owner',
        action:'RESCHEDULE', category:'session', target_type:'session',
        target_name: session.client_name,
        detail: `Rescheduled to ${reschedDate} at ${reschedStart}`,
      })
      setActionModal(null); load()
    } catch(e:any) { alert('Error: '+(e.message||e)) }
    finally { setActionSaving(false) }
  }

  const del = async (id:string) => {
    await supabase.from('calendar_events').delete().eq('id',id)
    setEvents(e=>e.filter(x=>x.id!==id)); setPopout(null)
  }

  const openDay = (dateStr:string) => { setForm({...blank,date:dateStr}); setShowForm(true) }
  const prev = () => month===0 ? (setMonth(11),setYear(y=>y-1)) : setMonth(m=>m-1)
  const next = () => month===11 ? (setMonth(0),setYear(y=>y+1)) : setMonth(m=>m+1)

  const monthName = new Date(year,month).toLocaleString('default',{month:'long'})
  const days = daysInMonth(year,month)
  const startPad = firstDay(year,month)

  const itemsForDay = (d:number) => {
    const key = `${year}-${pad(month+1)}-${pad(d)}`
    const evs = events.filter(e=>(e.date?String(e.date).slice(0,10):extractDate(e.start_time))===key)
      .map(e=>({...e,_isSession:false,_color:e.color||TYPE_COLORS[e.event_type]||'#8B5CF6',_label:e.title}))
    const ses = sessions.filter(s=>(s.date?String(s.date).slice(0,10):extractDate(s.start_time))===key)
      .map(s=>({...s,_isSession:true,_color:STUDIO_COLOR[s.studio]||'#8B5CF6',_label:s.client_name}))
    return [...evs,...ses]
  }

  const openPopout = (e:React.MouseEvent, item:any) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const winW = window.innerWidth, winH = window.innerHeight
    setPopout({ item, x:Math.min(rect.left,winW-300), y:Math.min(rect.bottom+8,winH-320) })
  }

  const openDayModal = (e:React.MouseEvent, dateStr:string, items:any[]) => {
    e.stopPropagation()
    setDayModal({ date:dateStr, items })
  }

  const empName = (id:string) => employees.find(e=>e.id===id)?.name||null

  const inp  = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:12,padding:'12px 14px',fontSize:16,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }
  const sinp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:10,padding:'10px 12px',fontSize:14,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }
  const overlay = { position:'fixed' as const,inset:0,background:'rgba(0,0,0,.85)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }

  return (
    <div style={{ padding:'16px 14px',display:'flex',flexDirection:'column',height:'calc(100dvh - 60px)',overflow:'hidden',position:'relative' }}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:10,flexShrink:0 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(139,92,246,.15)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)' }}>CALENDAR</div>
          <h1 style={{ fontSize:24,fontWeight:700 }}>Studio Calendar</h1>
        </div>
        <button onClick={()=>{setForm(blank);setShowForm(true)}} className="btn btn-primary"><Plus size={13}/> + Add Booking</button>
      </div>

      {/* Month nav */}
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10,flexShrink:0,flexWrap:'wrap' }}>
        <button onClick={prev} style={{ width:32,height:32,background:'#1A1030',border:'1px solid #2D1F4E',borderRadius:8,color:'#9CA3AF',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronLeft size={15}/></button>
        <span style={{ fontSize:18,fontWeight:700,minWidth:150,textAlign:'center' }}>{monthName} {year}</span>
        <button onClick={next} style={{ width:32,height:32,background:'#1A1030',border:'1px solid #2D1F4E',borderRadius:8,color:'#9CA3AF',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronRight size={15}/></button>
        <button onClick={()=>{setMonth(now.getMonth());setYear(now.getFullYear())}} style={{ padding:'5px 12px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:8,fontSize:12,cursor:'pointer' }}>Today</button>
        <span style={{ fontSize:12,color:'#4B5563',marginLeft:4 }}>{sessions.length} sessions · {events.length} events</span>
      </div>

      {/* Calendar grid */}
      <div style={{ background:'#1A1030',border:'1px solid #2D1F4E',borderRadius:14,overflow:'hidden',flex:1,display:'flex',flexDirection:'column' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid #2D1F4E',flexShrink:0 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
            <div key={d} style={{ padding:'10px 0',textAlign:'center',fontSize:11,fontWeight:600,color:'#4B5563',letterSpacing:'.06em' }}>{d}</div>
          ))}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',flex:1,overflowY:'auto' }}>
          {Array.from({length:startPad}).map((_,i)=>(
            <div key={`p${i}`} style={{ borderRight:'1px solid #1A1F38',borderBottom:'1px solid #1A1F38',background:'rgba(0,0,0,.15)',minHeight:90 }}/>
          ))}
          {Array.from({length:days}).map((_,i)=>{
            const d = i+1
            const dateStr = `${year}-${pad(month+1)}-${pad(d)}`
            const isToday = d===now.getDate()&&month===now.getMonth()&&year===now.getFullYear()
            const items = itemsForDay(d)
            const visible = items.slice(0,3)
            const hidden  = items.length - 3
            return (
              <div key={d} onClick={()=>openDay(dateStr)}
                style={{ borderRight:'1px solid #1A1F38',borderBottom:'1px solid #1A1F38',padding:5,cursor:'pointer',minHeight:90,transition:'background .1s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(139,92,246,.04)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div style={{ fontSize:12,fontWeight:isToday?700:400,color:isToday?'#EAB308':'#6B7280',width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:isToday?'rgba(234,179,8,.15)':'transparent',marginBottom:3 }}>{d}</div>
                {visible.map((item,idx)=>(
                  <div key={idx} onClick={e=>openPopout(e,item)}
                    style={{ fontSize:10,padding:'2px 5px',borderRadius:4,background:`${item._color}25`,color:item._color,border:`1px solid ${item._color}55`,marginBottom:2,display:'flex',alignItems:'center',gap:3,overflow:'hidden',cursor:'pointer',opacity:item.cancelled_at != null || item.payment_status==='Cancelled'?.45:1 }}
                    onMouseEnter={e=>(e.currentTarget.style.opacity=item.cancelled_at != null || item.payment_status==='Cancelled'?'.6':'.8')}
                    onMouseLeave={e=>(e.currentTarget.style.opacity=item.cancelled_at != null || item.payment_status==='Cancelled'?'.45':'1')}>
                    {item._isSession&&<div style={{ width:5,height:5,borderRadius:'50%',background:item._color,flexShrink:0 }}/>}
                    <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1 }}>{item._label}</span>
                    {!item._isSession&&(
                      <button onClick={e=>{e.stopPropagation();del(item.id)}}
                        style={{ background:'rgba(239,68,68,.25)',border:'none',borderRadius:3,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:12,height:12,flexShrink:0,padding:0 }}>
                        <X size={8}/>
                      </button>
                    )}
                  </div>
                ))}
                {/* Clickable "+N more" — opens day detail modal */}
                {hidden > 0 && (
                  <button
                    onClick={e=>openDayModal(e, dateStr, items)}
                    style={{ fontSize:9,color:'#A78BFA',background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.2)',borderRadius:4,padding:'1px 5px',cursor:'pointer',width:'100%',textAlign:'left',marginTop:1 }}>
                    +{hidden} more booking{hidden!==1?'s':''}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Popout detail card ── */}
      {popout && (
        <div ref={popoutRef}
          style={{ position:'fixed',left:popout.x,top:popout.y,width:284,background:'#1A1030',border:`2px solid ${popout.item._color}66`,borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,.6)',zIndex:200,padding:16 }}>
          <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:popout.item._color,borderRadius:'14px 14px 0 0' }}/>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,marginTop:4 }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:14,fontWeight:700,color:'#E8ECF4',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{popout.item._label||popout.item.title}</div>
              <div style={{ fontSize:11,color:popout.item._color,marginTop:2,fontWeight:600 }}>
                {popout.item._isSession?(popout.item.service||popout.item.session_type):popout.item.event_type}
                {popout.item.cancelled_at != null || item.payment_status==='Cancelled'&&<span style={{ marginLeft:6,color:'#F87171' }}>· Cancelled</span>}
              </div>
            </div>
            <button onClick={()=>setPopout(null)} style={{ background:'none',border:'none',color:'#4B5563',cursor:'pointer',padding:2,flexShrink:0,marginLeft:8 }}><X size={14}/></button>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
              <Clock size={12} style={{ color:'#6B7280' }}/>
              <span style={{ fontSize:12,color:'#D1D5DB' }}>
                {fmtDate(popout.item.start_time||popout.item.date)}
                {popout.item.start_time?` · ${fmtTime(popout.item.start_time)}`:''}
                {popout.item.end_time&&popout.item.end_time!==popout.item.start_time?` → ${fmtTime(popout.item.end_time)}`:''}
              </span>
            </div>
            {popout.item.studio&&popout.item.studio!=='N/A'&&(
              <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                <MapPin size={12} style={{ color:'#6B7280' }}/>
                <span style={{ fontSize:12,color:'#D1D5DB' }}>{popout.item.studio}</span>
                <span style={{ fontSize:10,padding:'1px 6px',borderRadius:4,background:`${STUDIO_COLOR[popout.item.studio]||'#6B7280'}22`,color:STUDIO_COLOR[popout.item.studio]||'#6B7280',border:`1px solid ${STUDIO_COLOR[popout.item.studio]||'#6B7280'}44`,fontWeight:600 }}>{popout.item.studio}</span>
              </div>
            )}
            {popout.item._isSession&&popout.item.employee_1_id&&(
              <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                <User size={12} style={{ color:'#6B7280' }}/>
                <span style={{ fontSize:12,color:'#D1D5DB' }}>{empName(popout.item.employee_1_id)||'—'}</span>
              </div>
            )}
          </div>
          {popout.item._isSession&&canEdit&&popout.!item.cancelled_at && item.payment_status!=='Cancelled'&&(
            <div style={{ marginTop:12,display:'flex',flexDirection:'column',gap:6 }}>
              <button onClick={()=>openEditSession(popout.item)}
                style={{ width:'100%',padding:'7px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:8,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontWeight:600 }}>
                <Edit2 size={11}/> Edit Booking
              </button>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                <button onClick={()=>openAction('reschedule',popout.item)}
                  style={{ padding:'7px',background:'rgba(6,182,212,.1)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)',borderRadius:8,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4,fontWeight:600 }}>
                  <RefreshCw size={10}/> Reschedule
                </button>
                <button onClick={()=>openAction('cancel',popout.item)}
                  style={{ padding:'7px',background:'rgba(239,68,68,.1)',color:'#F87171',border:'1px solid rgba(239,68,68,.25)',borderRadius:8,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4,fontWeight:600 }}>
                  <CalendarX size={10}/> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Day detail modal ("+N more bookings") ── */}
      {dayModal&&(
        <div style={overlay} onClick={()=>setDayModal(null)}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:480,maxHeight:'80vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <h3 style={{ fontSize:15,fontWeight:700,color:'#E8ECF4' }}>
                📅 {fmtDate(dayModal.date)} — {dayModal.items.length} booking{dayModal.items.length!==1?'s':''}
              </h3>
              <button onClick={()=>setDayModal(null)} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {dayModal.items.map((item,idx)=>(
                <div key={idx} style={{ padding:'12px 14px',background:'#0F0A1E',border:`1px solid ${item._color}44`,borderRadius:10,borderLeft:`3px solid ${item._color}`,opacity:item.cancelled_at != null || item.payment_status==='Cancelled'?.5:1 }}>
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8 }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:'#E8ECF4' }}>
                        {item._label}
                        {item.cancelled_at != null || item.payment_status==='Cancelled'&&<span style={{ marginLeft:6,fontSize:10,color:'#F87171',fontWeight:400 }}>Cancelled</span>}
                      </div>
                      <div style={{ fontSize:11,color:item._color,marginTop:1 }}>{item._isSession?(item.service||item.session_type):item.event_type}</div>
                      <div style={{ fontSize:11,color:'#6B7280',marginTop:3,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                        {item.start_time&&<span>🕐 {fmtTime(item.start_time)}{item.end_time&&item.end_time!==item.start_time?` → ${fmtTime(item.end_time)}`:''}</span>}
                        {item.studio&&item.studio!=='N/A'&&<span>📍 {item.studio}</span>}
                        {item._isSession&&item.employee_1_id&&<span>👤 {empName(item.employee_1_id)}</span>}
                      </div>
                    </div>
                    {item._isSession&&canEdit&&!item.cancelled_at && item.payment_status!=='Cancelled'&&(
                      <div style={{ display:'flex',gap:4,flexShrink:0 }}>
                        <button onClick={()=>openEditSession(item)} title="Edit"
                          style={{ padding:'4px 6px',background:'rgba(139,92,246,.15)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:6,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:3 }}>
                          <Edit2 size={10}/> Edit
                        </button>
                        <button onClick={()=>openAction('reschedule',item)} title="Reschedule"
                          style={{ padding:'4px 6px',background:'rgba(6,182,212,.1)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)',borderRadius:6,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:3 }}>
                          <RefreshCw size={10}/>
                        </button>
                        <button onClick={()=>openAction('cancel',item)} title="Cancel"
                          style={{ padding:'4px 6px',background:'rgba(239,68,68,.1)',color:'#F87171',border:'1px solid rgba(239,68,68,.25)',borderRadius:6,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:3 }}>
                          <CalendarX size={10}/>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Booking Modal ── */}
      {editModal&&(
        <div style={overlay} onClick={()=>setEditModal(null)}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <div>
                <h3 style={{ fontSize:16,fontWeight:700,color:'#A78BFA' }}>Edit Booking</h3>
                <p style={{ fontSize:12,color:'#6B7280',marginTop:2 }}>{editForm.client_name}</p>
              </div>
              <button onClick={()=>setEditModal(null)} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div><label className="label">Service</label>
                <select style={sinp} value={editForm.service} onChange={e=>setEF('service',e.target.value)}>
                  {SERVICES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Studio</label>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                  {['Studio A','Studio B'].map(s=>{
                    const active=editForm.studio===s, color=s==='Studio A'?'#8B5CF6':'#06B6D4'
                    return <button key={s} type="button" onClick={()=>setEF('studio',s)}
                      style={{ padding:'10px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',border:`2px solid ${active?color:'#2D1F4E'}`,background:active?`${color}22`:'#0F0A1E',color:active?color:'#6B7280' }}>{s}</button>
                  })}
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                <div><label className="label">Date</label><input style={sinp} type="date" value={editForm.date} onChange={e=>setEF('date',e.target.value)}/></div>
                <div><label className="label">Start Time</label><input style={sinp} type="time" value={editForm.start_time} onChange={e=>setEF('start_time',e.target.value)}/></div>
                <div><label className="label">End Time</label><input style={sinp} type="time" value={editForm.end_time} onChange={e=>setEF('end_time',e.target.value)}/></div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <div><label className="label">Engineer</label>
                  <select style={sinp} value={editForm.employee_1_id} onChange={e=>setEF('employee_1_id',e.target.value)}>
                    <option value="">— None —</option>
                    {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Employee 2</label>
                  <select style={sinp} value={editForm.employee_2_id} onChange={e=>setEF('employee_2_id',e.target.value)}>
                    <option value="">— None —</option>
                    {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Notes</label>
                <textarea rows={2} style={{ ...sinp,resize:'vertical' as any }} value={editForm.notes} onChange={e=>setEF('notes',e.target.value)}/>
              </div>
            </div>
            <div style={{ display:'flex',gap:8,marginTop:16 }}>
              <button onClick={saveEditSession} disabled={editSaving||!editForm.date||!editForm.start_time}
                className="btn btn-primary" style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                <Save size={13}/>{editSaving?'Saving…':'Save Changes'}
              </button>
              <button onClick={()=>setEditModal(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {actionModal?.type==='cancel'&&(
        <div style={overlay} onClick={()=>setActionModal(null)}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:440 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <div>
                <h3 style={{ fontSize:16,fontWeight:700,color:'#F87171' }}>Cancel Booking</h3>
                <p style={{ fontSize:12,color:'#6B7280',marginTop:2 }}>{actionModal.session.client_name} — {actionModal.session.service||actionModal.session.session_type}</p>
              </div>
              <button onClick={()=>setActionModal(null)} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <div><label className="label">Cancellation Reason</label>
                <select style={sinp} value={cancelReason} onChange={e=>setCancelReason(e.target.value)}>
                  {CANCEL_REASONS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="label">Additional Notes (optional)</label>
                <textarea rows={2} style={{ ...sinp,resize:'vertical' as any }} placeholder="Any details…" value={cancelNote} onChange={e=>setCancelNote(e.target.value)}/>
              </div>
              <div style={{ padding:'10px 12px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,fontSize:12,color:'#FCA5A5' }}>
                ⚠️ This will mark the booking as <strong>Cancelled</strong> and update the calendar. This action is logged.
              </div>
            </div>
            <div style={{ display:'flex',gap:8,marginTop:16 }}>
              <button onClick={confirmCancel} disabled={actionSaving}
                style={{ flex:1,padding:'10px',background:'rgba(239,68,68,.15)',color:'#F87171',border:'1px solid rgba(239,68,68,.35)',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                <CalendarX size={13}/>{actionSaving?'Cancelling…':'Confirm Cancellation'}
              </button>
              <button onClick={()=>setActionModal(null)} className="btn btn-ghost">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ── */}
      {actionModal?.type==='reschedule'&&(
        <div style={overlay} onClick={()=>setActionModal(null)}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:440 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <div>
                <h3 style={{ fontSize:16,fontWeight:700,color:'#22D3EE' }}>Reschedule Booking</h3>
                <p style={{ fontSize:12,color:'#6B7280',marginTop:2 }}>{actionModal.session.client_name} — {actionModal.session.service||actionModal.session.session_type}</p>
              </div>
              <button onClick={()=>setActionModal(null)} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <div style={{ padding:'8px 12px',background:'rgba(6,182,212,.06)',border:'1px solid rgba(6,182,212,.15)',borderRadius:8,fontSize:11,color:'#6B7280' }}>
                Current: {fmtDate(actionModal.session.start_time||actionModal.session.date)} · {fmtTime(actionModal.session.start_time||'')} · {actionModal.session.studio}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                <div><label className="label">New Date *</label><input style={sinp} type="date" value={reschedDate} onChange={e=>setReschedDate(e.target.value)}/></div>
                <div><label className="label">Start Time *</label><input style={sinp} type="time" value={reschedStart} onChange={e=>setReschedStart(e.target.value)}/></div>
                <div><label className="label">End Time</label><input style={sinp} type="time" value={reschedEnd} onChange={e=>setReschedEnd(e.target.value)}/></div>
              </div>
            </div>
            <div style={{ display:'flex',gap:8,marginTop:16 }}>
              <button onClick={confirmReschedule} disabled={actionSaving||!reschedDate||!reschedStart}
                style={{ flex:1,padding:'10px',background:'rgba(6,182,212,.12)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.3)',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                <RefreshCw size={13}/>{actionSaving?'Rescheduling…':'Confirm Reschedule'}
              </button>
              <button onClick={()=>setActionModal(null)} className="btn btn-ghost">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Booking modal (calendar events) ── */}
      {showForm&&(
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }} onClick={()=>setShowForm(false)}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308' }}>{form.date?`Add Booking — ${form.date}`:'Add Booking'}</h3>
              <button onClick={()=>setShowForm(false)} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <div><label className="label">Title *</label><input style={inp} placeholder="Event title" value={form.title} onChange={e=>setF('title',e.target.value)} autoFocus/></div>
              <div className="g2">
                <div><label className="label">Date *</label><input style={inp} type="date" value={form.date} onChange={e=>setF('date',e.target.value)}/></div>
                <div><label className="label">Type</label>
                  <select style={inp} value={form.event_type} onChange={e=>setF('event_type',e.target.value)}>
                    {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Start Time</label><input style={inp} type="time" step="3600" value={form.start_time} onChange={e=>setF('start_time',e.target.value)}/></div>
                <div><label className="label">End Time</label><input style={inp} type="time" step="3600" value={form.end_time} onChange={e=>setF('end_time',e.target.value)}/></div>
                <div><label className="label">Studio</label>
                  <select style={inp} value={form.studio} onChange={e=>setF('studio',e.target.value)}>
                    {['N/A','Studio A','Studio B','Both'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="label">Assign To</label>
                  <select style={inp} value={form.assigned_to} onChange={e=>setF('assigned_to',e.target.value)}>
                    <option value="">— None —</option>
                    {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display:'flex',gap:8,marginTop:16 }}>
              <button onClick={save} disabled={saving||!form.title.trim()||!form.date} className="btn btn-primary" style={{ flex:1 }}>{saving?'Saving…':'+ Save Booking'}</button>
              <button onClick={()=>setShowForm(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
