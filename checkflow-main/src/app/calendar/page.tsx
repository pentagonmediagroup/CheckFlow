'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react'

const EVENT_TYPES = ['General','Meeting','Rehearsal','Maintenance','Blocked','Holiday','Other']
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

// Parse time from a timestamptz string — extract HH:MM ignoring timezone
const fmtTime = (ts:string) => {
  if (!ts) return ''
  const raw = String(ts)
  // Match HH:MM from any format: '2026-05-13T17:00:00+00:00' or '2026-05-13 17:00:00+00'
  const m = raw.match(/[T ](\d{2}):(\d{2})/)
  if (!m) return ''
  let h = parseInt(m[1]), min = m[2], ampm = 'AM'
  if (h >= 12) { ampm = 'PM'; if (h > 12) h -= 12 }
  if (h === 0) h = 12
  return `${h}:${min} ${ampm}`
}

const fmtDate = (ts:string) => {
  if (!ts) return ''
  // Parse date portion only to avoid timezone shifts
  const raw = String(ts)
  const dm = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!dm) return ''
  const d = new Date(parseInt(dm[1]), parseInt(dm[2])-1, parseInt(dm[3]))
  return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})
}

// Extract YYYY-MM-DD from a timestamptz string without converting timezone
const extractDate = (ts:string): string => {
  if (!ts) return ''
  return String(ts).slice(0,10) // always 'YYYY-MM-DD'
}

interface PopoutEvent { item:any; x:number; y:number }

export default function CalendarPage() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events,    setEvents]    = useState<any[]>([])
  const [sessions,  setSessions]  = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [popout,    setPopout]    = useState<PopoutEvent|null>(null)
  const popoutRef = useRef<HTMLDivElement>(null)

  const blank = { title:'', date:'', start_time:'', end_time:'', event_type:'General', studio:'N/A', assigned_to:'', description:'' }
  const [form, setForm] = useState<any>(blank)

  const load = async () => {
    const from = `${year}-${pad(month+1)}-01`
    const to   = `${year}-${pad(month+1)}-${pad(daysInMonth(year,month))}`

    const [{ data:ev, error:evErr }, { data:se, error:seErr }, { data:em }] = await Promise.all([
      // Use 'date' column for calendar_events (plain date, no tz issues)
      supabase.from('calendar_events').select('*').gte('date',from).lte('date',to).order('start_time'),
      // Use 'date' column for sessions (plain date stored alongside timestamptz)
      supabase.from('sessions').select('id,client_name,session_type,service,start_time,end_time,date,studio,payment_status,employee_1_id').gte('date',from).lte('date',to).order('date'),
      supabase.from('employees').select('id,name').order('name'),
    ])

    if (evErr) console.error('Events error:', evErr.message)
    if (seErr) console.error('Sessions error:', seErr.message)

    setEvents(ev||[])
    setSessions(se||[])
    setEmployees(em||[])
  }

  useEffect(() => { load() }, [year,month])

  // Close popout on outside click
  useEffect(() => {
    const handler = (e:MouseEvent) => {
      if (popout && popoutRef.current && !popoutRef.current.contains(e.target as Node)) {
        setPopout(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popout])

  const set = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}))

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
      color:TYPE_COLORS[form.event_type]||'#8B5CF6',
      date:form.date,
    })
    if (error) { alert('Error: '+error.message); setSaving(false); return }
    setForm(blank); setShowForm(false); setSaving(false); load()
  }

  const del = async (id:string) => {
    await supabase.from('calendar_events').delete().eq('id',id)
    setEvents(e=>e.filter(x=>x.id!==id))
    setPopout(null)
  }

  const openDay = (dateStr:string) => { setForm({...blank,date:dateStr}); setShowForm(true) }
  const prev = () => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const next = () => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  const monthName = new Date(year,month).toLocaleString('default',{month:'long'})
  const days = daysInMonth(year,month)
  const startPad = firstDay(year,month)

  // Match items to a day using date string extraction (no timezone conversion)
  const itemsForDay = (d:number) => {
    const key = `${year}-${pad(month+1)}-${pad(d)}`
    const evs = events.filter(e => {
      // Use date column if available, else extract from start_time
      const dateVal = e.date ? String(e.date).slice(0,10) : extractDate(e.start_time)
      return dateVal === key
    }).map(e=>({
      ...e, _isSession:false,
      _color: e.color || TYPE_COLORS[e.event_type] || '#8B5CF6',
      _label: e.title,
    }))
    const ses = sessions.filter(s => {
      // Use date column (plain date) — most reliable
      const dateVal = s.date ? String(s.date).slice(0,10) : extractDate(s.start_time)
      return dateVal === key
    }).map(s=>({
      ...s, _isSession:true,
      _color: STUDIO_COLOR[s.studio] || '#8B5CF6',
      _label: s.client_name,
    }))
    return [...evs,...ses]
  }

  const openPopout = (e:React.MouseEvent, item:any) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const winW = typeof window !== 'undefined' ? window.innerWidth  : 800
    const winH = typeof window !== 'undefined' ? window.innerHeight : 600
    setPopout({ item, x:Math.min(rect.left, winW-280), y:Math.min(rect.bottom+8, winH-240) })
  }

  const empName = (id:string) => employees.find(e=>e.id===id)?.name || null

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:12,padding:'12px 14px',fontSize:16,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }

  return (
    <div style={{ padding:'16px 14px',display:'flex',flexDirection:'column',height:'calc(100dvh - 60px)',overflow:'hidden',position:'relative' }}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:10,flexShrink:0 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(139,92,246,.15)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)' }}>CALENDAR</div>
          <h1 style={{ fontSize:24,fontWeight:700 }}>Studio Calendar</h1>
        </div>
        <button onClick={()=>{setForm(blank);setShowForm(true)}} className="btn btn-primary"><Plus size={13}/> Add Event</button>
      </div>

      {/* Month nav */}
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10,flexShrink:0,flexWrap:'wrap' }}>
        <button onClick={prev} style={{ width:32,height:32,background:'#1A1030',border:'1px solid #2D1F4E',borderRadius:8,color:'#9CA3AF',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronLeft size={15}/></button>
        <span style={{ fontSize:18,fontWeight:700,minWidth:150,textAlign:'center' }}>{monthName} {year}</span>
        <button onClick={next} style={{ width:32,height:32,background:'#1A1030',border:'1px solid #2D1F4E',borderRadius:8,color:'#9CA3AF',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronRight size={15}/></button>
        <button onClick={()=>{setMonth(now.getMonth());setYear(now.getFullYear())}} style={{ padding:'5px 12px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:8,fontSize:12,cursor:'pointer' }}>Today</button>
        {/* Session count indicator */}
        <span style={{ fontSize:12,color:'#4B5563',marginLeft:4 }}>
          {sessions.length} session{sessions.length!==1?'s':''} · {events.length} event{events.length!==1?'s':''}
        </span>
      </div>

      {/* Calendar grid */}
      <div style={{ background:'#1A1030',border:'1px solid #2D1F4E',borderRadius:14,overflow:'hidden',flex:1,display:'flex',flexDirection:'column' }}>
        {/* Day headers */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid #2D1F4E',flexShrink:0 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
            <div key={d} style={{ padding:'10px 0',textAlign:'center',fontSize:11,fontWeight:600,color:'#4B5563',letterSpacing:'.06em' }}>{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',flex:1,overflowY:'auto' }}>
          {Array.from({length:startPad}).map((_,i)=>(
            <div key={`p${i}`} style={{ borderRight:'1px solid #1A1F38',borderBottom:'1px solid #1A1F38',background:'rgba(0,0,0,.15)',minHeight:90 }}/>
          ))}
          {Array.from({length:days}).map((_,i)=>{
            const d = i+1
            const dateStr = `${year}-${pad(month+1)}-${pad(d)}`
            const isToday = d===now.getDate()&&month===now.getMonth()&&year===now.getFullYear()
            const items = itemsForDay(d)
            return (
              <div key={d} onClick={()=>openDay(dateStr)}
                style={{ borderRight:'1px solid #1A1F38',borderBottom:'1px solid #1A1F38',padding:5,cursor:'pointer',minHeight:90,transition:'background .1s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(139,92,246,.04)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div style={{ fontSize:12,fontWeight:isToday?700:400,color:isToday?'#EAB308':'#6B7280',width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:isToday?'rgba(234,179,8,.15)':'transparent',marginBottom:3 }}>{d}</div>
                {items.slice(0,3).map((item,idx)=>(
                  <div key={idx}
                    onClick={e=>openPopout(e,item)}
                    style={{ fontSize:10,padding:'2px 5px',borderRadius:4,background:`${item._color}25`,color:item._color,border:`1px solid ${item._color}55`,marginBottom:2,display:'flex',alignItems:'center',gap:3,overflow:'hidden',cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.opacity='0.8')}
                    onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                    {item._isSession && <div style={{ width:5,height:5,borderRadius:'50%',background:item._color,flexShrink:0 }}/>}
                    <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1 }}>{item._label}</span>
                    {!item._isSession && (
                      <button onClick={e=>{e.stopPropagation();del(item.id)}}
                        style={{ background:'rgba(239,68,68,.25)',border:'none',borderRadius:3,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:12,height:12,flexShrink:0,padding:0 }}>
                        <X size={8}/>
                      </button>
                    )}
                  </div>
                ))}
                {items.length>3&&<div style={{ fontSize:9,color:'#4B5563' }}>+{items.length-3} more</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Popout detail card */}
      {popout && (
        <div ref={popoutRef}
          style={{ position:'fixed', left:popout.x, top:popout.y, width:270, background:'#1A1030', border:`2px solid ${popout.item._color}66`, borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.6)', zIndex:200, padding:16 }}>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:popout.item._color,borderRadius:'14px 14px 0 0' }}/>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,marginTop:4 }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:14,fontWeight:700,color:'#E8ECF4',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{popout.item._label||popout.item.title}</div>
              <div style={{ fontSize:11,color:popout.item._color,marginTop:2,fontWeight:600 }}>
                {popout.item._isSession ? (popout.item.service||popout.item.session_type) : popout.item.event_type}
              </div>
            </div>
            <button onClick={()=>setPopout(null)} style={{ background:'none',border:'none',color:'#4B5563',cursor:'pointer',padding:2,flexShrink:0,marginLeft:8 }}><X size={14}/></button>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
              <Clock size={12} style={{ color:'#6B7280',flexShrink:0 }}/>
              <span style={{ fontSize:12,color:'#D1D5DB' }}>
                {fmtDate(popout.item.start_time||popout.item.date)}
                {popout.item.start_time ? ` · ${fmtTime(popout.item.start_time)}` : ''}
                {popout.item.end_time && popout.item.end_time!==popout.item.start_time ? ` → ${fmtTime(popout.item.end_time)}` : ''}
              </span>
            </div>
            {(popout.item.studio && popout.item.studio!=='N/A') && (
              <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                <MapPin size={12} style={{ color:'#6B7280',flexShrink:0 }}/>
                <span style={{ fontSize:12,color:'#D1D5DB' }}>{popout.item.studio}</span>
                <span style={{ fontSize:10,padding:'1px 6px',borderRadius:4,background:`${STUDIO_COLOR[popout.item.studio]||'#6B7280'}22`,color:STUDIO_COLOR[popout.item.studio]||'#6B7280',border:`1px solid ${STUDIO_COLOR[popout.item.studio]||'#6B7280'}44`,fontWeight:600 }}>{popout.item.studio}</span>
              </div>
            )}
            {popout.item._isSession && popout.item.employee_1_id && (
              <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                <User size={12} style={{ color:'#6B7280',flexShrink:0 }}/>
                <span style={{ fontSize:12,color:'#D1D5DB' }}>{empName(popout.item.employee_1_id)||'—'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Event modal */}
      {showForm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }} onClick={()=>setShowForm(false)}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308' }}>{form.date?`Add Event — ${form.date}`:'Add Event'}</h3>
              <button onClick={()=>setShowForm(false)} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <div><label className="label">Title *</label><input style={inp} placeholder="Event title" value={form.title} onChange={e=>set('title',e.target.value)} autoFocus/></div>
              <div className="g2">
                <div><label className="label">Date *</label><input style={inp} type="date" value={form.date} onChange={e=>set('date',e.target.value)}/></div>
                <div><label className="label">Type</label>
                  <select style={inp} value={form.event_type} onChange={e=>set('event_type',e.target.value)}>
                    {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Start Time</label><input style={inp} type="time" step="3600" value={form.start_time} onChange={e=>set('start_time',e.target.value)}/></div>
                <div><label className="label">End Time</label><input style={inp} type="time" step="3600" value={form.end_time} onChange={e=>set('end_time',e.target.value)}/></div>
                <div><label className="label">Studio</label>
                  <select style={inp} value={form.studio} onChange={e=>set('studio',e.target.value)}>
                    {['N/A','Studio A','Studio B','Both'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="label">Assign To</label>
                  <select style={inp} value={form.assigned_to} onChange={e=>set('assigned_to',e.target.value)}>
                    <option value="">— None —</option>
                    {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display:'flex',gap:8,marginTop:16 }}>
              <button onClick={save} disabled={saving||!form.title.trim()||!form.date} className="btn btn-primary" style={{ flex:1 }}>{saving?'Saving…':'+ Save Event'}</button>
              <button onClick={()=>setShowForm(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
