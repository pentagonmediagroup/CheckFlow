'use client'
import Link from 'next/link'
import { SESSIONS } from '@/lib/data'
import { CalendarDays, Clock } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div style={{ padding: '20px 24px', maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', display: 'inline-block', marginBottom: 4 }}>CALENDAR</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>All Sessions</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>Upcoming & past studio bookings</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SESSIONS.map((s) => (
          <Link key={s.id} href={`/sessions/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#111525', border: '1px solid #1E2340', borderRadius: 12, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', background: s.engineer === 'A' ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.15)', color: s.engineer === 'A' ? '#A78BFA' : '#F59E0B', border: s.engineer === 'A' ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(245,158,11,0.25)' }}>{s.engineer}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#E8ECF4' }}>{s.client}</div>
              <div style={{ fontSize: 11, color: '#4B5563', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{s.type}</span>
                <span style={{ color: '#1E2340' }}>•</span>
                <span>{s.room}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Clock size={11} style={{ color: '#4B5563' }} />
              <span style={{ fontSize: 12, color: '#6B7280' }}>{s.date} · {s.time}</span>
            </div>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 500, flexShrink: 0, background: s.status === 'Unpaid' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.12)', color: s.status === 'Unpaid' ? '#F87171' : '#34D399', border: s.status === 'Unpaid' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(16,185,129,0.25)' }}>{s.status}</span>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 16px', minHeight: 40, background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          <CalendarDays size={14} /> Book New Session
        </Link>
      </div>
    </div>
  )
}
