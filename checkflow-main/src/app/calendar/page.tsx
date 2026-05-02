'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { MOCK_SESSIONS } from '@/lib/mockData'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Save } from 'lucide-react'
import Link from 'next/link'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7)

type CalEvent = {
  id: string; title: string; start_time: string; end_time: string
  event_type: string; studio: string; color: string; session_id: string | null
}

const EVENT_COLORS: Record<string, string> = {
  'General': '#6B21A8', 'Meeting': '#3B82F6', 'Rehearsal': '#EAB308',
  'Maintenance': '#EF4444', 'Blocked': '#6B7280', 'Holiday': '#22C55E', 'Other': '#8B5CF6',
}

const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
const inputStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E' }

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [events, setEvents] = useState<CalEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clickedDay, setClickedDay] = useState<Date | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', date: '', startTime: '09:00', endTime: '10:00',
    event_type: 'General', studio: 'N/A', color: '#6B21A8',
  })

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => { fetchEvents() }, [weekStart])

  const fetchEvents = async () => {
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()

    // Load calendar events
    const { data: calData } = await supabase.from('calendar_events')
      .select('*').gte('start_time', from).lt('start_time', to)

    // Load sessions as events too
    const { data: sessData } = await supabase.from('sessions')
      .select('id, service, studio, start_time, end_time, clients(name)')
      .gte('start_time', from).lt('start_time', to)

    const sessionEvents: CalEvent[] = (sessData || []).map((s: any) => ({
      id: `session-${s.id}`, title: `${s.clients?.name} — ${s.service}`,
      start_time: s.start_time, end_time: s.end_time,
      event_type: 'General', studio: s.studio, color: s.studio === 'Studio A' ? '#6B21A8' : '#A16207',
      session_id: s.id,
    }))

    const allEvents = [...(calData || []), ...sessionEvents]
    if (allEvents.length > 0) {
      setEvents(allEvents)
    } else {
      // fallback to mock
      const mockEvents = MOCK_SESSIONS.map(s => ({
        id: `mock-${s.id}`, title: `${s.clients.name} — ${s.service}`,
        start_time: s.start_time, end_time: s.end_time,
        event_type: 'General', studio: s.studio, color: s.studio === 'Studio A' ? '#6B21A8' : '#A16207',
        session_id: s.id,
      }))
      setEvents(mockEvents)
    }
  }

  const handleDayClick = (day: Date) => {
    setClickedDay(day)
    setForm(p => ({ ...p, date: format(day, 'yyyy-MM-dd') }))
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.date) return
    setSaving(true)
    const start = new Date(`${form.date}T${form.startTime}`)
    const end = new Date(`${form.date}T${form.endTime}`)
    const color = EVENT_COLORS[form.event_type] || '#6B21A8'

    const { data, error } = await supabase.from('calendar_events').insert({
      title: form.title, start_time: start.toISOString(), end_time: end.toISOString(),
      event_type: form.event_type, studio: form.studio, color,
    }).select().single()

    if (!error && data) setEvents(prev => [...prev, data])
    setShowForm(false)
    setSaving(false)
    setForm({ title: '', description: '', date: '', startTime: '09:00', endTime: '10:00', event_type: 'General', studio: 'N/A', color: '#6B21A8' })
  }

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(new Date(e.start_time), day))
  const getTopPercent = (dt: Date) => ((dt.getHours() - 7 + dt.getMinutes() / 60) / 14) * 100
  const getHeightPercent = (start: Date, end: Date) => Math.max(((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 14)) * 100, 4)

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Calendar</h1>
            <p className="text-gray-400 text-sm mt-1">
              {format(weekStart, 'MMMM d')} – {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ border: '1px solid #2D1F4E' }}>
              <ChevronLeft size={18} className="text-gray-400" />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-4 py-2 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
              style={{ border: '1px solid #2D1F4E', color: '#EAB308' }}>
              Today
            </button>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ border: '1px solid #2D1F4E' }}>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold ml-2 transition-all"
              style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
              <Plus size={14} /> Add Event
            </button>
            <Link href="/book"
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ border: '1px solid #2D1F4E', color: '#9CA3AF' }}>
              + Book Session
            </Link>
          </div>
        </div>

        {/* Add Event Form */}
        {showForm && (
          <div className="rounded-xl p-5 mb-6" style={{ background: '#1A1030', border: '1px solid #6B21A8' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold text-white">New Calendar Event</h3>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-500 hover:text-white" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Event Title *</label>
                <input className={inputClass} style={inputStyle} placeholder="e.g. Team Meeting"
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                <select className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))}>
                  {Object.keys(EVENT_COLORS).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date *</label>
                <input type="date" className={inputClass} style={inputStyle}
                  value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start Time</label>
                <input type="time" className={inputClass} style={inputStyle}
                  value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End Time</label>
                <input type="time" className={inputClass} style={inputStyle}
                  value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Studio</label>
                <select className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.studio} onChange={e => setForm(p => ({ ...p, studio: e.target.value }))}>
                  {['Studio A','Studio B','Both','N/A'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving || !form.title || !form.date}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Event'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid #2D1F4E' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
          <div className="grid grid-cols-8 border-b border-[#2D1F4E]">
            <div className="p-3" />
            {days.map(day => (
              <div key={day.toISOString()} className="p-3 text-center border-l border-[#2D1F4E] cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleDayClick(day)}>
                <div className="text-xs text-gray-500 uppercase font-medium">{format(day, 'EEE')}</div>
                <div className={`text-lg font-bold font-display mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isToday(day) ? 'text-black' : 'text-white'}`}
                  style={isToday(day) ? { background: '#EAB308' } : {}}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="relative overflow-auto" style={{ height: '560px' }}>
            <div className="grid grid-cols-8" style={{ minHeight: '560px' }}>
              <div className="relative">
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full px-3 text-right"
                    style={{ top: `${((h - 7) / 14) * 100}%`, transform: 'translateY(-50%)' }}>
                    <span className="text-xs text-gray-600">{h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}</span>
                  </div>
                ))}
              </div>
              {days.map(day => {
                const dayEvents = getEventsForDay(day)
                return (
                  <div key={day.toISOString()} className="relative border-l border-[#2D1F4E]">
                    {HOURS.map(h => (
                      <div key={h} className="absolute w-full border-t" style={{ top: `${((h - 7) / 14) * 100}%`, borderColor: '#2D1F4E' }} />
                    ))}
                    {dayEvents.map(event => {
                      const start = new Date(event.start_time)
                      const end = new Date(event.end_time)
                      const top = getTopPercent(start)
                      const height = getHeightPercent(start, end)
                      const content = (
                        <div className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ top: `${top}%`, height: `${height}%`, background: `linear-gradient(135deg, ${event.color}cc, ${event.color}88)`, border: `1px solid ${event.color}` }}>
                          <div className="text-xs font-semibold text-white truncate">{event.title}</div>
                          <div className="text-xs truncate opacity-70 text-white">{format(start, 'h:mm a')}</div>
                        </div>
                      )
                      return event.session_id
                        ? <Link key={event.id} href={`/sessions/${event.session_id}`}>{content}</Link>
                        : <div key={event.id}>{content}</div>
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ background: '#6B21A8' }} />Studio A (Session)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ background: '#A16207' }} />Studio B (Session)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ background: '#3B82F6' }} />Meeting</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ background: '#22C55E' }} />Holiday</div>
          <p className="ml-auto text-gray-600 italic">Click any day header to add an event</p>
        </div>
      </div>
    </AppShell>
  )
}
