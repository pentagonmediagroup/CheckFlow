'use client'
import { useEffect, useState, useRef, CSSProperties } from 'react'
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
  'Studio A':'#8B5CF6','Studio B':'#06B6D4','Both':'#F59E0B',
}

const pad = (n: number) => String(n).padStart(2, '0')
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay()

const fmtTime = (ts: string) => {
  if (!ts) return ''
  const match = String(ts).match(/[T ](\d{2}):(\d{2})/)
  if (!match) return ''
  let h = parseInt(match[1])
  const min = match[2]
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${min} ${ampm}`
}

const fmtDate = (ts: string) => {
  if (!ts) return ''
  const dm = String(ts).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!dm) return ''
  return new Date(parseInt(dm[1]), parseInt(dm[2]) - 1, parseInt(dm[3]))
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const extractDate = (ts: string) => (ts ? String(ts).slice(0, 10) : '')
const extractTime = (ts: string) => {
  const match = String(ts).match(/[T ](\d{2}:\d{2})/)
  return match ? match[1] : ''
}

const isCancelled = (item: any) =>
  item.cancelled_at != null || item.payment_status === 'Cancelled'

interface PopoutPos { item: any; x: number; y: number }
interface DayModal { date: string; items: any[] }

export default function CalendarPage() {
  const now = new Date()
  const { user } = useAuth()
  const canEdit =
    user?.role === 'owner' ||
    user?.role === 'executive_assistant' ||
    user?.app_role === 'owner'

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [popout, setPopout] = useState<PopoutPos | null>(null)
  const [dayModal, setDayModal] = useState<DayModal | null>(null)
  const [editModal, setEditModal] = useState<any | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editSaving, setEditSaving] = useState(false)
  const [actionModal, setActionModal] = useState<{ type: 'cancel' | 'reschedule'; session: any } | null>(null)
  const [cancelReason, setCancelReason] = useState('Client Cancelled')
  const [cancelNote, setCancelNote] = useState('')
  const [reschedDate, setReschedDate] = useState('')
  const [reschedStart, setReschedStart] = useState('')
  const [reschedEnd, setReschedEnd] = useState('')
  const [actionSaving, setActionSaving] = useState(false)

  const popoutRef = useRef<HTMLDivElement>(null)

  const blankForm = { title: '', date: '', start_time: '', end_time: '', event_type: 'General', studio: 'N/A', assigned_to: '', description: '' }
  const [addForm, setAddForm] = useState<any>(blankForm)

  const load = async () => {
    const from = `${year}-${pad(month + 1)}-01`
    const to = `${year}-${pad(month + 1)}-${pad(daysInMonth(year, month))}`
    const [{ data: ev }, { data: se }, { data: em }] = await Promise.all([
      supabase.from('calendar_events').select('*').gte('date', from).lte('date', to).order('start_time'),
      supabase.from('sessions').select('id,client_name,session_type,service,start_time,end_time,date,studio,payment_status,cancelled_at,cancellation_reason,employee_1_id,employee_2_id,employee_3_id,notes').gte('date', from).lte('date', to).order('date'),
      supabase.from('employees').select('id,name').order('name'),
    ])
    setEvents(ev || [])
    setSessions(se || [])
    setEmployees(em || [])
  }

  useEffect(() => { load() }, [year, month])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popout && popoutRef.current && !popoutRef.current.contains(e.target as Node)) {
        setPopout(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popout])

  const setAF = (k: string, v: any) => setAddForm((f: any) => ({ ...f, [k]: v }))
  const setEF = (k: string, v: any) => setEditForm((f: any) => ({ ...f, [k]: v }))

  const saveNewEvent = async () => {
    if (!addForm.title.trim() || !addForm.date || !addForm.start_time) return
    setSaving(true)
    const startTs = `${addForm.date}T${addForm.start_time}:00`
    const endTs = addForm.end_time ? `${addForm.date}T${addForm.end_time}:00` : startTs
    const { error } = await supabase.from('calendar_events').insert({
      title: addForm.title.trim(),
      description: addForm.description,
      start_time: startTs,
      end_time: endTs,
      event_type: addForm.event_type,
      studio: addForm.studio || 'N/A',
      assigned_to: addForm.assigned_to || null,
      color: TYPE_COLORS[addForm.event_type] || '#8B5CF6',
      date: addForm.date,
    })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    setAddForm(blankForm)
    setShowAddForm(false)
    setSaving(false)
    load()
  }

  const openEditSession = (session: any) => {
    setPopout(null)
    setDayModal(null)
    setEditForm({
      id: session.id,
      client_name: session.client_name || '',
      service: session.service || session.session_type || 'Recording Session',
      studio: session.studio || 'Studio A',
      date: session.date ? String(session.date).slice(0, 10) : extractDate(session.start_time || ''),
      start_time: extractTime(session.start_time || ''),
      end_time: extractTime(session.end_time || ''),
      employee_1_id: session.employee_1_id || '',
      employee_2_id: session.employee_2_id || '',
      notes: session.notes || '',
    })
    setEditModal(session)
  }

  const saveEdit = async () => {
    if (!editForm.date || !editForm.start_time) return
    setEditSaving(true)
    try {
      const startTs = `${editForm.date}T${editForm.start_time}:00`
      const endTs = editForm.end_time ? `${editForm.date}T${editForm.end_time}:00` : startTs
      const { error } = await supabase.from('sessions').update({
        service: editForm.service,
        session_type: editForm.service,
        studio: editForm.studio,
        date: editForm.date,
        start_time: startTs,
        end_time: endTs,
        employee_1_id: editForm.employee_1_id || null,
        employee_2_id: editForm.employee_2_id || null,
        notes: editForm.notes,
        updated_at: new Date().toISOString(),
      }).eq('id', editForm.id)
      if (error) throw error
      await supabase.from('calendar_events').update({
        title: `${editForm.client_name} \u2013 ${editForm.service}`,
        start_time: startTs,
        end_time: endTs,
        studio: editForm.studio,
        date: editForm.date,
        color: editForm.studio === 'Studio A' ? '#8B5CF6' : '#06B6D4',
        assigned_to: editForm.employee_1_id || null,
        description: editForm.notes,
      }).eq('session_id', editForm.id)
      await supabase.from('audit_log').insert({
        actor_username: user?.username || 'system',
        actor_role: user?.role || 'owner',
        action: 'UPDATE',
        category: 'session',
        target_type: 'session',
        target_name: editForm.client_name,
        detail: `Updated: ${editForm.service} in ${editForm.studio} on ${editForm.date}`,
      })
      setEditModal(null)
      load()
    } catch (e: any) { alert('Error: ' + (e.message || e)) }
    finally { setEditSaving(false) }
  }

  const openAction = (type: 'cancel' | 'reschedule', session: any) => {
    setPopout(null)
    setDayModal(null)
    setCancelReason('Client Cancelled')
    setCancelNote('')
    setReschedDate('')
    setReschedStart(extractTime(session.start_time || ''))
    setReschedEnd(extractTime(session.end_time || ''))
    setActionModal({ type, session })
  }

  const confirmCancel = async () => {
    if (!actionModal) return
    setActionSaving(true)
    const s = actionModal.session
    try {
      await supabase.from('sessions').update({
        payment_status: 'Cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancelReason,
        notes: [s.notes, `CANCELLED: ${cancelReason}${cancelNote ? ` \u2014 ${cancelNote}` : ''}`].filter(Boolean).join('\n'),
        updated_at: new Date().toISOString(),
      }).eq('id', s.id)
      await supabase.from('calendar_events').update({
        title: `\u274C ${s.client_name} \u2013 ${s.service || s.session_type} (Cancelled)`,
        color: '#4B5563',
        description: `Cancelled: ${cancelReason}${cancelNote ? ` \u2014 ${cancelNote}` : ''}`,
      }).eq('session_id', s.id)
      await supabase.from('audit_log').insert({
        actor_username: user?.username || 'system',
        actor_role: user?.role || 'owner',
        action: 'CANCEL',
        category: 'session',
        target_type: 'session',
        target_name: s.client_name,
        detail: `Cancelled: ${cancelReason}`,
      })
      setActionModal(null)
      load()
    } catch (e: any) { alert('Error: ' + (e.message || e)) }
    finally { setActionSaving(false) }
  }

  const confirmReschedule = async () => {
    if (!actionModal || !reschedDate || !reschedStart) return
    setActionSaving(true)
    const s = actionModal.session
    try {
      const newStart = `${reschedDate}T${reschedStart}:00`
      const newEnd = reschedEnd ? `${reschedDate}T${reschedEnd}:00` : newStart
      await supabase.from('sessions').update({
        date: reschedDate,
        start_time: newStart,
        end_time: newEnd,
        payment_status: 'Rescheduled',
        notes: [s.notes, `RESCHEDULED to ${reschedDate} at ${reschedStart} by ${user?.username || 'system'}`].filter(Boolean).join('\n'),
        updated_at: new Date().toISOString(),
      }).eq('id', s.id)
      await supabase.from('calendar_events').update({
        title: `\uD83D\uDD04 ${s.client_name} \u2013 ${s.service || s.session_type}`,
        start_time: newStart,
        end_time: newEnd,
        date: reschedDate,
        color: s.studio === 'Studio A' ? '#8B5CF6' : '#06B6D4',
        description: `Rescheduled from ${extractDate(s.start_time || '')}`,
      }).eq('session_id', s.id)
      await supabase.from('audit_log').insert({
        actor_username: user?.username || 'system',
        actor_role: user?.role || 'owner',
        action: 'RESCHEDULE',
        category: 'session',
        target_type: 'session',
        target_name: s.client_name,
        detail: `Rescheduled to ${reschedDate} at ${reschedStart}`,
      })
      setActionModal(null)
      load()
    } catch (e: any) { alert('Error: ' + (e.message || e)) }
    finally { setActionSaving(false) }
  }

  const deleteEvent = async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id)
    setEvents(e => e.filter(x => x.id !== id))
    setPopout(null)
  }

  const openAddForDay = (dateStr: string) => {
    setAddForm({ ...blankForm, date: dateStr })
    setShowAddForm(true)
  }

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })
  const days = daysInMonth(year, month)
  const startPad = firstDay(year, month)

  const itemsForDay = (d: number) => {
    const key = `${year}-${pad(month + 1)}-${pad(d)}`
    const evs = events
      .filter(e => (e.date ? String(e.date).slice(0, 10) : extractDate(e.start_time || '')) === key)
      .map(e => ({ ...e, _isSession: false, _color: e.color || TYPE_COLORS[e.event_type] || '#8B5CF6', _label: e.title }))
    const ses = sessions
      .filter(s => (s.date ? String(s.date).slice(0, 10) : extractDate(s.start_time || '')) === key)
      .map(s => ({ ...s, _isSession: true, _color: STUDIO_COLOR[s.studio] || '#8B5CF6', _label: s.client_name }))
    return [...evs, ...ses]
  }

  const openPopout = (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const winW = typeof window !== 'undefined' ? window.innerWidth : 800
    const winH = typeof window !== 'undefined' ? window.innerHeight : 600
    setPopout({ item, x: Math.min(rect.left, winW - 300), y: Math.min(rect.bottom + 8, winH - 340) })
  }

  const openDayModal = (e: React.MouseEvent, dateStr: string, items: any[]) => {
    e.stopPropagation()
    setDayModal({ date: dateStr, items })
  }

  const empName = (id: string) => employees.find(e => e.id === id)?.name || null

  // Styles
  const inp: CSSProperties = { background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 12, padding: '12px 14px', fontSize: 16, color: '#E8ECF4', width: '100%', outline: 'none', fontFamily: 'inherit' }
  const sinp: CSSProperties = { background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#E8ECF4', width: '100%', outline: 'none', fontFamily: 'inherit' }
  const overlayStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
  const navBtn: CSSProperties = { width: 32, height: 32, background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 60px)', overflow: 'hidden', position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10, flexShrink: 0 }}>
        <div>
          <div className="page-badge" style={{ background: 'rgba(139,92,246,.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,.3)' }}>CALENDAR</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Studio Calendar</h1>
        </div>
        <button onClick={() => { setAddForm(blankForm); setShowAddForm(true) }} className="btn btn-primary">
          <Plus size={13} /> + Add Booking
        </button>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={prev} style={navBtn}><ChevronLeft size={15} /></button>
        <span style={{ fontSize: 18, fontWeight: 700, minWidth: 150, textAlign: 'center' }}>{monthName} {year}</span>
        <button onClick={next} style={navBtn}><ChevronRight size={15} /></button>
        <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()) }}
          style={{ padding: '5px 12px', background: 'rgba(139,92,246,.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
          Today
        </button>
        <span style={{ fontSize: 12, color: '#4B5563', marginLeft: 4 }}>
          {sessions.length} sessions · {events.length} events
        </span>
      </div>

      {/* Grid */}
      <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #2D1F4E', flexShrink: 0 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#4B5563', letterSpacing: '.06em' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', flex: 1, overflowY: 'auto' }}>
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`p${i}`} style={{ borderRight: '1px solid #1A1F38', borderBottom: '1px solid #1A1F38', background: 'rgba(0,0,0,.15)', minHeight: 90 }} />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
            const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
            const items = itemsForDay(d)
            const visible = items.slice(0, 3)
            const hiddenCount = items.length - 3
            return (
              <div key={d} onClick={() => openAddForDay(dateStr)}
                style={{ borderRight: '1px solid #1A1F38', borderBottom: '1px solid #1A1F38', padding: 5, cursor: 'pointer', minHeight: 90, transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? '#EAB308' : '#6B7280', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isToday ? 'rgba(234,179,8,.15)' : 'transparent', marginBottom: 3 }}>{d}</div>
                {visible.map((item, idx) => (
                  <div key={idx} onClick={e => openPopout(e, item)}
                    style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: `${item._color}25`, color: item._color, border: `1px solid ${item._color}55`, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', cursor: 'pointer', opacity: isCancelled(item) ? 0.4 : 1 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = isCancelled(item) ? '0.4' : '1')}>
                    {item._isSession && <div style={{ width: 5, height: 5, borderRadius: '50%', background: item._color, flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item._label}</span>
                    {!item._isSession && (
                      <button onClick={e => { e.stopPropagation(); deleteEvent(item.id) }}
                        style={{ background: 'rgba(239,68,68,.25)', border: 'none', borderRadius: 3, color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 12, height: 12, flexShrink: 0, padding: 0 }}>
                        <X size={8} />
                      </button>
                    )}
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <button onClick={e => openDayModal(e, dateStr, items)}
                    style={{ fontSize: 9, color: '#A78BFA', background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.2)', borderRadius: 4, padding: '1px 5px', cursor: 'pointer', width: '100%', textAlign: 'left', marginTop: 1 }}>
                    +{hiddenCount} more booking{hiddenCount !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Popout */}
      {popout && (
        <div ref={popoutRef}
          style={{ position: 'fixed', left: popout.x, top: popout.y, width: 284, background: '#1A1030', border: `2px solid ${popout.item._color}66`, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.6)', zIndex: 200, padding: 16 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: popout.item._color, borderRadius: '14px 14px 0 0' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E8ECF4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{popout.item._label || popout.item.title}</div>
              <div style={{ fontSize: 11, color: popout.item._color, marginTop: 2, fontWeight: 600 }}>
                {popout.item._isSession ? (popout.item.service || popout.item.session_type) : popout.item.event_type}
                {isCancelled(popout.item) && <span style={{ marginLeft: 6, color: '#F87171' }}>· Cancelled</span>}
              </div>
            </div>
            <button onClick={() => setPopout(null)} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', padding: 2, flexShrink: 0, marginLeft: 8 }}><X size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Clock size={12} style={{ color: '#6B7280' }} />
              <span style={{ fontSize: 12, color: '#D1D5DB' }}>
                {fmtDate(popout.item.start_time || popout.item.date)}
                {popout.item.start_time ? ` · ${fmtTime(popout.item.start_time)}` : ''}
                {popout.item.end_time && popout.item.end_time !== popout.item.start_time ? ` \u2192 ${fmtTime(popout.item.end_time)}` : ''}
              </span>
            </div>
            {popout.item.studio && popout.item.studio !== 'N/A' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <MapPin size={12} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: 12, color: '#D1D5DB' }}>{popout.item.studio}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${STUDIO_COLOR[popout.item.studio] || '#6B7280'}22`, color: STUDIO_COLOR[popout.item.studio] || '#6B7280', border: `1px solid ${STUDIO_COLOR[popout.item.studio] || '#6B7280'}44`, fontWeight: 600 }}>{popout.item.studio}</span>
              </div>
            )}
            {popout.item._isSession && popout.item.employee_1_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <User size={12} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: 12, color: '#D1D5DB' }}>{empName(popout.item.employee_1_id) || '—'}</span>
              </div>
            )}
          </div>
          {popout.item._isSession && canEdit && !isCancelled(popout.item) && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => openEditSession(popout.item)}
                style={{ width: '100%', padding: '7px', background: 'rgba(139,92,246,.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: 600 }}>
                <Edit2 size={11} /> Edit Booking
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button onClick={() => openAction('reschedule', popout.item)}
                  style={{ padding: '7px', background: 'rgba(6,182,212,.1)', color: '#22D3EE', border: '1px solid rgba(6,182,212,.25)', borderRadius: 8, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 600 }}>
                  <RefreshCw size={10} /> Reschedule
                </button>
                <button onClick={() => openAction('cancel', popout.item)}
                  style={{ padding: '7px', background: 'rgba(239,68,68,.1)', color: '#F87171', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 600 }}>
                  <CalendarX size={10} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Day Modal */}
      {dayModal && (
        <div style={overlayStyle} onClick={() => setDayModal(null)}>
          <div className="card" style={{ padding: 24, width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E8ECF4' }}>
                {fmtDate(dayModal.date)} — {dayModal.items.length} booking{dayModal.items.length !== 1 ? 's' : ''}
              </h3>
              <button onClick={() => setDayModal(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayModal.items.map((item, idx) => (
                <div key={idx} style={{ padding: '12px 14px', background: '#0F0A1E', border: `1px solid ${item._color}44`, borderRadius: 10, borderLeft: `3px solid ${item._color}`, opacity: isCancelled(item) ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#E8ECF4' }}>
                        {item._label}
                        {isCancelled(item) && <span style={{ marginLeft: 6, fontSize: 10, color: '#F87171' }}>Cancelled</span>}
                      </div>
                      <div style={{ fontSize: 11, color: item._color, marginTop: 1 }}>{item._isSession ? (item.service || item.session_type) : item.event_type}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {item.start_time && <span>🕐 {fmtTime(item.start_time)}{item.end_time && item.end_time !== item.start_time ? ` → ${fmtTime(item.end_time)}` : ''}</span>}
                        {item.studio && item.studio !== 'N/A' && <span>📍 {item.studio}</span>}
                        {item._isSession && item.employee_1_id && <span>👤 {empName(item.employee_1_id)}</span>}
                      </div>
                    </div>
                    {item._isSession && canEdit && !isCancelled(item) && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => openEditSession(item)} style={{ padding: '4px 7px', background: 'rgba(139,92,246,.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,.3)', borderRadius: 6, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Edit2 size={10} /> Edit
                        </button>
                        <button onClick={() => openAction('reschedule', item)} style={{ padding: '4px 7px', background: 'rgba(6,182,212,.1)', color: '#22D3EE', border: '1px solid rgba(6,182,212,.25)', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>
                          <RefreshCw size={10} />
                        </button>
                        <button onClick={() => openAction('cancel', item)} style={{ padding: '4px 7px', background: 'rgba(239,68,68,.1)', color: '#F87171', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>
                          <CalendarX size={10} />
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

      {/* Edit Modal */}
      {editModal && (
        <div style={overlayStyle} onClick={() => setEditModal(null)}>
          <div className="card" style={{ padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#A78BFA' }}>Edit Booking</h3>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{editForm.client_name}</p>
              </div>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Service</label>
                <select style={sinp} value={editForm.service} onChange={e => setEF('service', e.target.value)}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Studio</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['Studio A', 'Studio B'].map(s => {
                    const active = editForm.studio === s
                    const color = s === 'Studio A' ? '#8B5CF6' : '#06B6D4'
                    return (
                      <button key={s} type="button" onClick={() => setEF('studio', s)}
                        style={{ padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `2px solid ${active ? color : '#2D1F4E'}`, background: active ? `${color}22` : '#0F0A1E', color: active ? color : '#6B7280' }}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label className="label">Date</label><input style={sinp} type="date" value={editForm.date} onChange={e => setEF('date', e.target.value)} /></div>
                <div><label className="label">Start</label><input style={sinp} type="time" value={editForm.start_time} onChange={e => setEF('start_time', e.target.value)} /></div>
                <div><label className="label">End</label><input style={sinp} type="time" value={editForm.end_time} onChange={e => setEF('end_time', e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Engineer</label>
                  <select style={sinp} value={editForm.employee_1_id} onChange={e => setEF('employee_1_id', e.target.value)}>
                    <option value="">— None —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Employee 2</label>
                  <select style={sinp} value={editForm.employee_2_id} onChange={e => setEF('employee_2_id', e.target.value)}>
                    <option value="">— None —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea rows={2} style={{ ...sinp, resize: 'vertical' }} value={editForm.notes} onChange={e => setEF('notes', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={saveEdit} disabled={editSaving || !editForm.date || !editForm.start_time}
                className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Save size={13} />{editSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditModal(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {actionModal?.type === 'cancel' && (
        <div style={overlayStyle} onClick={() => setActionModal(null)}>
          <div className="card" style={{ padding: 24, width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F87171' }}>Cancel Booking</h3>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{actionModal.session.client_name}</p>
              </div>
              <button onClick={() => setActionModal(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Reason</label>
                <select style={sinp} value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                  {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea rows={2} style={{ ...sinp, resize: 'vertical' }} value={cancelNote} onChange={e => setCancelNote(e.target.value)} />
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, fontSize: 12, color: '#FCA5A5' }}>
                ⚠️ Marks booking as Cancelled and updates the calendar. This is logged.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={confirmCancel} disabled={actionSaving}
                style={{ flex: 1, padding: '10px', background: 'rgba(239,68,68,.15)', color: '#F87171', border: '1px solid rgba(239,68,68,.35)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CalendarX size={13} />{actionSaving ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
              <button onClick={() => setActionModal(null)} className="btn btn-ghost">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {actionModal?.type === 'reschedule' && (
        <div style={overlayStyle} onClick={() => setActionModal(null)}>
          <div className="card" style={{ padding: 24, width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#22D3EE' }}>Reschedule Booking</h3>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{actionModal.session.client_name}</p>
              </div>
              <button onClick={() => setActionModal(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '8px 12px', background: 'rgba(6,182,212,.06)', border: '1px solid rgba(6,182,212,.15)', borderRadius: 8, fontSize: 11, color: '#6B7280' }}>
                Current: {fmtDate(actionModal.session.start_time || actionModal.session.date)} · {fmtTime(actionModal.session.start_time || '')} · {actionModal.session.studio}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label className="label">New Date *</label><input style={sinp} type="date" value={reschedDate} onChange={e => setReschedDate(e.target.value)} /></div>
                <div><label className="label">Start *</label><input style={sinp} type="time" value={reschedStart} onChange={e => setReschedStart(e.target.value)} /></div>
                <div><label className="label">End</label><input style={sinp} type="time" value={reschedEnd} onChange={e => setReschedEnd(e.target.value)} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={confirmReschedule} disabled={actionSaving || !reschedDate || !reschedStart}
                style={{ flex: 1, padding: '10px', background: 'rgba(6,182,212,.12)', color: '#22D3EE', border: '1px solid rgba(6,182,212,.3)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RefreshCw size={13} />{actionSaving ? 'Rescheduling…' : 'Confirm Reschedule'}
              </button>
              <button onClick={() => setActionModal(null)} className="btn btn-ghost">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowAddForm(false)}>
          <div className="card" style={{ padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAB308' }}>{addForm.date ? `Add Booking — ${addForm.date}` : 'Add Booking'}</h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label className="label">Title *</label><input style={inp} placeholder="Event title" value={addForm.title} onChange={e => setAF('title', e.target.value)} autoFocus /></div>
              <div className="g2">
                <div><label className="label">Date *</label><input style={inp} type="date" value={addForm.date} onChange={e => setAF('date', e.target.value)} /></div>
                <div><label className="label">Type</label>
                  <select style={inp} value={addForm.event_type} onChange={e => setAF('event_type', e.target.value)}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Start Time</label><input style={inp} type="time" value={addForm.start_time} onChange={e => setAF('start_time', e.target.value)} /></div>
                <div><label className="label">End Time</label><input style={inp} type="time" value={addForm.end_time} onChange={e => setAF('end_time', e.target.value)} /></div>
                <div><label className="label">Studio</label>
                  <select style={inp} value={addForm.studio} onChange={e => setAF('studio', e.target.value)}>
                    {['N/A', 'Studio A', 'Studio B', 'Both'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="label">Assign To</label>
                  <select style={inp} value={addForm.assigned_to} onChange={e => setAF('assigned_to', e.target.value)}>
                    <option value="">— None —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={saveNewEvent} disabled={saving || !addForm.title.trim() || !addForm.date} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? 'Saving…' : '+ Save Booking'}
              </button>
              <button onClick={() => setShowAddForm(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
