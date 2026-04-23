'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { MOCK_SESSIONS } from '@/lib/mockData'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7am - 9pm

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getSessionsForDay = (day: Date) =>
    MOCK_SESSIONS.filter(s => isSameDay(new Date(s.start_time), day))

  const getTopPercent = (dt: Date) => ((dt.getHours() - 7 + dt.getMinutes() / 60) / 14) * 100
  const getHeightPercent = (start: Date, end: Date) => ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 14)) * 100

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Calendar</h1>
            <p className="text-gray-400 text-sm mt-1">
              {format(weekStart, 'MMMM d')} – {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ border: '1px solid #2D1F4E' }}>
              <ChevronLeft size={18} className="text-gray-400" />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
              style={{ border: '1px solid #2D1F4E', color: '#EAB308' }}>
              Today
            </button>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ border: '1px solid #2D1F4E' }}>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
            <Link href="/book"
              className="px-4 py-2 rounded-lg text-xs font-semibold ml-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #6B21A8, #4C1D95)', color: '#EAB308' }}>
              + Book
            </Link>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-[#2D1F4E]">
            <div className="p-3" />
            {days.map(day => (
              <div key={day.toISOString()}
                className="p-3 text-center border-l border-[#2D1F4E]">
                <div className="text-xs text-gray-500 uppercase font-medium">{format(day, 'EEE')}</div>
                <div className={`text-lg font-bold font-display mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto
                  ${isToday(day) ? 'text-black' : 'text-white'}`}
                  style={isToday(day) ? { background: '#EAB308' } : {}}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative overflow-auto" style={{ height: '560px' }}>
            <div className="grid grid-cols-8" style={{ minHeight: '560px' }}>
              {/* Time labels */}
              <div className="relative">
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full px-3 text-right"
                    style={{ top: `${((h - 7) / 14) * 100}%`, transform: 'translateY(-50%)' }}>
                    <span className="text-xs text-gray-600">{h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map(day => {
                const sessions = getSessionsForDay(day)
                return (
                  <div key={day.toISOString()} className="relative border-l border-[#2D1F4E]">
                    {/* Hour lines */}
                    {HOURS.map(h => (
                      <div key={h} className="absolute w-full border-t border-[#1A1030]"
                        style={{ top: `${((h - 7) / 14) * 100}%`, borderColor: '#2D1F4E' }} />
                    ))}

                    {/* Sessions */}
                    {sessions.map(session => {
                      const start = new Date(session.start_time)
                      const end = new Date(session.end_time)
                      const top = getTopPercent(start)
                      const height = Math.max(getHeightPercent(start, end), 4)
                      const isA = session.studio === 'Studio A'

                      return (
                        <Link key={session.id} href={`/sessions/${session.id}`}
                          className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            top: `${top}%`, height: `${height}%`,
                            background: isA ? 'linear-gradient(135deg, rgba(107,33,168,0.8), rgba(76,29,149,0.8))' : 'linear-gradient(135deg, rgba(161,98,7,0.8), rgba(120,53,15,0.8))',
                            border: `1px solid ${isA ? '#6B21A8' : '#EAB308'}`,
                          }}>
                          <div className="text-xs font-semibold text-white truncate">{session.clients.name}</div>
                          <div className="text-xs truncate" style={{ color: isA ? '#C084FC' : '#FDE047' }}>
                            {session.studio} · {format(start, 'h:mm a')}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#6B21A8' }} />
            Studio A
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#A16207' }} />
            Studio B
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-dashed" style={{ borderColor: '#EAB308' }} />
            Buffer (30 min)
          </div>
        </div>
      </div>
    </AppShell>
  )
}
