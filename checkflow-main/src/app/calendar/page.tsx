'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const EVENT_TYPES = ['Session','Meeting','Rehearsal','Shoot Day','Delivery','Other']
const TYPE_COLORS: Record<string, string> = {
  Session: '#8B5CF6', Meeting: '#06B6D4', Rehearsal: '#F59E0B',
  'Shoot Day': '#10B981', Delivery: '#F87171', Other: '#6B7280',
}

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstDay(y: number, m: number) { return new Date(y, m, 1).getDay() }

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const blank = { title: '', date: '', start_time: '', end_time: '', event_type: 'Session', assigned_staff_ids: [] as string[], notes: '' }
  const [form, setForm] = useState(blank)

  const load = async () => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const from = `${year}-${pad(month + 1)}-01`
    const to = `${year}-${pad(month + 1)}-${pad(daysInMonth(year, month))}`
    const [{ data: ev }, { data: se }, { data: st }] = await Promise.all([
      supabase.from('calendar_events').select('*').gte('date', from).lte('date', to).order('date'),
      supabase.from('sessions').select('id,client_name,session_type,date,start_time,studio,payment_status').gte('date', from).lte('date', to).order('date'),
      supabase.from('staff').select('id,name').order('name'),
    ])
    setEvents(ev || [])
    setSessions(se || [])
    setStaff(st || [])
  }

  useEffect(() => { load() }, [year, month])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleStaff = (id: string) => set('assigned_staff_ids', form.assigned_staff_ids.includes(id) ? form.assigned_staff_ids.filter((x: string) => x !== id) : [...form.assigned_staff_ids, id])

  const save = async () => {
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    await supabase.from('calendar_events').insert({ ...form, title: form.title.trim() })
    setForm(blank); setShowForm(false); setSaving(false); load()
  }

  const del = async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id)
    setEvents(e => e.filter(x => x.id !== id))
  }

  const openDay = (dateStr: string) => {
    setForm({ ...blank, date: dateStr })
    setSelectedDay(dateStr)
    setShowForm(true)
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const pad = (n: number) => String(n).padStart(2, '0')
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })
  const days = daysInMonth(year, month)
  const startPad = firstDay(year, month)
  const allDayItems = [...events, ...sessions.map(s => ({ ...s, title: s.client_name, event_type: 'Session', isSession: true }))]

  const itemsForDay = (d: number) => {
    const key = `${year}-${pad(month + 1)}-${pad(d)}`
    return allDayItems.filter(e => e.date === key)
  }

  const inputStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#E8ECF4', width: '100%', outline: 'none', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.04em' }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', display: 'inline-block', marginBottom: 4 }}>CALENDAR</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8ECF4' }}>Studio Calendar</h1>
        </div>
        <button onClick={() => { setForm(blank); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Add Event
        </button>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ width: 34, height: 34, background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#E8ECF4', minWidth: 160, textAlign: 'center' }}>{monthName} {year}</span>
        <button onClick={nextMonth} style={{ width: 34, height: 34, background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
        <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
          style={{ padding: '6px 12px', background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer', marginLeft: 4 }}>Today</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([t, c]) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 11, color: '#6B7280' }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #2D1F4E' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#4B5563', letterSpacing: '.06em' }}>{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} style={{ minHeight: 90, borderRight: '1px solid #1A1F38', borderBottom: '1px solid #1A1F38', background: 'rgba(0,0,0,0.2)' }} />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const items = itemsForDay(d)
            return (
              <div key={d} onClick={() => openDay(dateStr)}
                style={{ minHeight: 90, borderRight: '1px solid #1A1F38', borderBottom: '1px solid #1A1F38', padding: 6, cursor: 'pointer', transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? '#EAB308' : '#6B7280', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isToday ? 'rgba(234,179,8,0.15)' : 'transparent', marginBottom: 4 }}>{d}</div>
                {items.slice(0, 3).map((ev, idx) => {
                  const color = TYPE_COLORS[ev.event_type] || '#6B7280'
                  return (
                    <div key={idx} style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: `${color}22`, color, border: `1px solid ${color}44`, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title || ev.client_name}
                    </div>
                  )
                })}
                {items.length > 3 && <div style={{ fontSize: 10, color: '#4B5563' }}>+{items.length - 3} more</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Event modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#0C0F1E', border: '1px solid #2D1F4E', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAB308' }}>
                {form.date ? `Add Event — ${form.date}` : 'Add Event'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Title *</label><input style={inputStyle} placeholder="Event title" value={form.title} onChange={e => set('title', e.target.value)} autoFocus /></div>
              <div className="grid-2">
                <div><label style={labelStyle}>Date *</label><input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
                <div><label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={form.event_type} onChange={e => set('event_type', e.target.value)}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Start Time</label><input style={inputStyle} type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} /></div>
                <div><label style={labelStyle}>End Time</label><input style={inputStyle} type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} /></div>
              </div>
              <div>
                <label style={labelStyle}>Assign Staff</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {staff.map(s => {
                    const sel = form.assigned_staff_ids.includes(s.id)
                    return (
                      <button key={s.id} onClick={() => toggleStaff(s.id)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: sel ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: sel ? '#A78BFA' : '#6B7280', border: `1px solid ${sel ? 'rgba(139,92,246,0.4)' : '#2D1F4E'}` }}>{s.name}</button>
                    )
                  })}
                </div>
              </div>
              <div><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button onClick={save} disabled={saving || !form.title.trim() || !form.date} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: (!form.title.trim() || !form.date) ? .5 : 1 }}>
                {saving ? 'Saving…' : '+ Save Event'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid #2D1F4E', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
