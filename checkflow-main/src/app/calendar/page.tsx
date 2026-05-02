'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { MOCK_SESSIONS } from '@/lib/mockData'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Save } from 'lucide-react'
import Link from 'next/link'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7)

type CalEvent = { id: string; title: string; start_time: string; end_time: string; event_type: string; studio: string; color: string; session_id: string | null }

const EVENT_TYPES = ['General','Meeting','Rehearsal','Maintenance','Blocked','Holiday','Other']
const EVENT_COLORS: Record<string,string> = { General:'#6B21A8', Meeting:'#3B82F6', Rehearsal:'#EAB308', Maintenance:'#EF4444', Blocked:'#6B7280', Holiday:'#22C55E', Other:'#8B5CF6' }

const inp = "w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
const inpStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E' }

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [events, setEvents] = useState<CalEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', startTime: '09:00', endTime: '10:00', event_type: 'General', studio: 'N/A' })

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => { fetchEvents() }, [weekStart])

  const fetchEvents = async () => {
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()
    const { data: calData } = await supabase.from('calendar_events').select('*').gte('start_time', from).lt('start_time', to)
    const { data: sessData } = await supabase.from('sessions').select('id,service,studio,start_time,end_time,clients(name)').gte('start_time', from).lt('start_time', to)

    const sessEvents: CalEvent[] = (sessData || []).map((s: any) => ({
      id: `sess-${s.id}`, title: `${s.clients?.name} — ${s.service}`,
      start_time: s.start_time, end_time: s.end_time,
      event_type: 'General', studio: s.studio,
      color: s.studio === 'Studio A' ? '#6B21A8' : '#A16207', session_id: s.id,
    }))

    const all = [...(calData || []), ...sessEvents]
    if (all.length > 0) {
      setEvents(all)
    } else {
      setEvents(MOCK_SESSIONS.map(s => ({
        id: `mock-${s.id}`, title: `${s.clients.name}`,
        start_time: s.start_time, end_time: s.end_time,
        event_type: 'General', studio: s.studio,
        color: s.studio === 'Studio A' ? '#6B21A8' : '#A16207', session_id: s.id,
      })))
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.date) return
    setSaving(true)
    const start = new Date(`${form.date}T${form.startTime}`)
    const end = new Date(`${form.date}T${form.endTime}`)
    const color = EVENT_COLORS[form.event_type] || '#6B21A8'
    const { data, error } = await supabase.from('calendar_events').insert({ title: form.title, start_time: start.toISOString(), end_time: end.toISOString(), event_type: form.event_type, studio: form.studio, color }).select().single()
    if (!error && data) setEvents(p => [...p, data])
    setShowForm(false); setSaving(false)
    setForm({ title: '', date: '', startTime: '09:00', endTime: '10:00', event_type: 'General', studio: 'N/A' })
  }

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(new Date(e.start_time), day))
  const topPct = (dt: Date) => ((dt.getHours() - 7 + dt.getMinutes() / 60) / 14) * 100
  const heightPct = (s: Date, e: Date) => Math.max(((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 14)) * 100, 3.5)

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#2D1F4E', color: '#9CA3AF' }}>calendar</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }}>LIVE</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Calendar</h1>
            <p className="text-gray-400 text-xs md:text-sm mt-0.5">
              {format(weekStart, 'MMMM d')} – {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ border: '1px solid #2D1F4E' }}>
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/10 transition-colors"
              style={{ border: '1px solid #2D1F4E', color: '#EAB308' }}>Today</button>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ border: '1px solid #2D1F4E' }}>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
              <Plus size={13}/> Add Event
            </button>
            <Link href="/book" className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:text-white text-gray-400"
              style={{ border: '1px solid #2D1F4E' }}>
              + Book
            </Link>
          </div>
        </div>

        {/* Add Event form */}
        {showForm && (
          <div className="rounded-xl p-4 md:p-5 mb-4" style={{ background: '#1A1030', border: '1px solid #6B21A8' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base font-semibold text-white">New Event</h3>
              <button onClick={() => setShowForm(false)}><X size={15} className="text-gray-500 hover:text-white" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">Event Title *</label>
                <input className={inp} style={inpStyle} placeholder="e.g. Team Meeting"
                  value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} autoFocus />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                <select className={inp} style={{ ...inpStyle, appearance:'none' }}
                  value={form.event_type} onChange={e => setForm(p=>({...p,event_type:e.target.value}))}>
                  {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Studio</label>
                <select className={inp} style={{ ...inpStyle, appearance:'none' }}
                  value={form.studio} onChange={e => setForm(p=>({...p,studio:e.target.value}))}>
                  {['Studio A','Studio B','Both','N/A'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date *</label>
                <input type="date" className={inp} style={inpStyle} value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start</label>
                <input type="time" className={inp} style={inpStyle} value={form.startTime} onChange={e => setForm(p=>({...p,startTime:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End</label>
                <input type="time" className={inp} style={inpStyle} value={form.endTime} onChange={e => setForm(p=>({...p,endTime:e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleSave} disabled={saving || !form.title || !form.date}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
                <Save size={13}/> {saving ? 'Saving...' : 'Save Event'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid #2D1F4E' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
          {/* Day headers */}
          <div className="grid border-b border-[#2D1F4E]" style={{ gridTemplateColumns: '44px repeat(7,1fr)' }}>
            <div />
            {days.map(day => (
              <div key={day.toISOString()}
                className="p-2 text-center border-l border-[#2D1F4E] cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => { setForm(p=>({...p, date:format(day,'yyyy-MM-dd')})); setShowForm(true) }}>
                <div className="text-[9px] md:text-xs text-gray-500 uppercase font-medium">{format(day,'EEE')}</div>
                <div className={`text-sm md:text-lg font-display font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto ${isToday(day)?'text-black':'text-white'}`}
                  style={isToday(day)?{background:'#EAB308'}:{}}>
                  {format(day,'d')}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative overflow-auto" style={{ height: '480px' }}>
            <div className="relative" style={{ height: '100%', display: 'grid', gridTemplateColumns: '44px repeat(7,1fr)' }}>
              {/* Hour labels */}
              <div className="relative">
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full pr-2 text-right"
                    style={{ top: `${((h-7)/14)*100}%`, transform: 'translateY(-50%)' }}>
                    <span className="text-[9px] md:text-[10px] text-gray-600">
                      {h===12?'12p':h>12?`${h-12}p`:`${h}a`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map(day => {
                const dayEvents = getEventsForDay(day)
                return (
                  <div key={day.toISOString()} className="relative border-l border-[#2D1F4E]" style={{ height: '100%' }}>
                    {HOURS.map(h => (
                      <div key={h} className="absolute w-full border-t border-[#2D1F4E] opacity-50"
                        style={{ top: `${((h-7)/14)*100}%` }} />
                    ))}
                    {dayEvents.map(ev => {
                      const s = new Date(ev.start_time)
                      const e = new Date(ev.end_time)
                      const block = (
                        <div className="absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ top:`${topPct(s)}%`, height:`${heightPct(s,e)}%`, background:`${ev.color}cc`, border:`1px solid ${ev.color}` }}>
                          <div className="text-[9px] md:text-[10px] font-semibold text-white truncate leading-tight">{ev.title}</div>
                          <div className="text-[8px] md:text-[9px] text-white/70 truncate">{format(s,'h:mm a')}</div>
                        </div>
                      )
                      return ev.session_id
                        ? <Link key={ev.id} href={`/sessions/${ev.session_id}`}>{block}</Link>
                        : <div key={ev.id}>{block}</div>
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{background:'#6B21A8'}}/> Studio A</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{background:'#A16207'}}/> Studio B</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{background:'#3B82F6'}}/> Meeting</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{background:'#22C55E'}}/> Holiday</div>
          <p className="ml-auto text-gray-600 text-[10px] italic hidden sm:block">Tap a day to add an event</p>
        </div>
      </div>
    </AppShell>
  )
}
