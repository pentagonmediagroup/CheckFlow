'use client'
import Link from 'next/link'
import { CalendarDays, SquareCheckBig, DollarSign, CircleAlert, ArrowRight, Clock } from 'lucide-react'
import { SESSIONS, TASKS } from '@/lib/data'

const STATS = [
  { label: 'Est. Revenue',      value: '$580', trend: '↑ +12% vs last mo', trendColor: '#34D399', Icon: DollarSign,      iconBg: 'rgba(245,158,11,0.12)',  iconBorder: 'rgba(245,158,11,0.2)',  iconColor: '#F59E0B' },
  { label: 'Upcoming Sessions', value: '2',    trend: '1 today',           trendColor: '#4B5563', Icon: CalendarDays,    iconBg: 'rgba(139,92,246,0.12)', iconBorder: 'rgba(139,92,246,0.2)', iconColor: '#8B5CF6' },
  { label: 'Active Tasks',      value: '7',    trend: '1 ready',           trendColor: '#4B5563', Icon: SquareCheckBig,  iconBg: 'rgba(6,182,212,0.12)',  iconBorder: 'rgba(6,182,212,0.2)',  iconColor: '#06B6D4' },
  { label: 'Unpaid Sessions',   value: '1',    trend: 'Action needed',     trendColor: '#F87171', Icon: CircleAlert,     iconBg: 'rgba(239,68,68,0.12)',  iconBorder: 'rgba(239,68,68,0.2)',  iconColor: '#EF4444' },
]

const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const upcomingSessions = SESSIONS.slice(0, 2)

export default function DashboardPage() {
  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', display: 'inline-block', marginBottom: 4 }}>OWNER DASHBOARD</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#E8ECF4' }}>Studio Overview</h1>
          <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>{today}</p>
        </div>
        <Link href="/book" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', minHeight: 40, background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>+ Book</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {STATS.map(({ label, value, trend, trendColor, Icon, iconBg, iconBorder, iconColor }) => (
          <div key={label} style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} style={{ color: iconColor }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: trendColor, textAlign: 'right', maxWidth: 90, lineHeight: 1.3 }}>{trend}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#E8ECF4' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Sessions + Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12, marginBottom: 14 }}>
        {/* Upcoming Sessions */}
        <div style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1A1F38' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={13} style={{ color: '#8B5CF6' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>Upcoming Sessions</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', fontFamily: 'monospace' }}>2</span>
            </div>
            <Link href="/calendar" style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none', minHeight: 36 }}>All <ArrowRight size={11} /></Link>
          </div>
          {upcomingSessions.map((s) => (
            <Link key={s.id} href={`/sessions/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #1A1F38', textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', background: s.engineer === 'A' ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.15)', color: s.engineer === 'A' ? '#A78BFA' : '#F59E0B', border: s.engineer === 'A' ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(245,158,11,0.3)' }}>{s.engineer}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.client}</div>
                <div style={{ fontSize: 11, color: '#4B5563', marginTop: 1 }}>{s.type}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 7px', borderRadius: 5, fontWeight: 500, flexShrink: 0, background: s.status === 'Unpaid' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.12)', color: s.status === 'Unpaid' ? '#F87171' : '#34D399', border: s.status === 'Unpaid' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(16,185,129,0.25)' }}>{s.status}</span>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#E8ECF4' }}>{s.date}</div>
                <div style={{ fontSize: 10, color: '#4B5563', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 1 }}><Clock size={9} />{s.time}</div>
              </div>
            </Link>
          ))}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #1A1F38' }}>
            <Link href="/book" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 36, background: 'rgba(109,40,217,0.2)', color: '#A78BFA', border: '1px solid rgba(109,40,217,0.35)', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Book New Session</Link>
          </div>
        </div>

        {/* Task Pipeline */}
        <div style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1A1F38' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SquareCheckBig size={13} style={{ color: '#06B6D4' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>Task Pipeline</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(6,182,212,0.12)', color: '#22D3EE', fontFamily: 'monospace' }}>7</span>
            </div>
            <Link href="/tasks" style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none', minHeight: 36 }}>Board <ArrowRight size={11} /></Link>
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
            {TASKS.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#D1D5DB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.client}</div>
                  <div style={{ fontSize: 10, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.type}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, fontWeight: 500, whiteSpace: 'nowrap', background: `${t.color}1F`, color: t.color }}>{t.stage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { href: '/book',     label: 'Book Session',  iconBg: 'rgba(139,92,246,0.1)',  iconBorder: 'rgba(139,92,246,0.2)',  iconColor: '#8B5CF6',  Icon: CalendarDays },
          { href: '/tasks',    label: 'Task Pipeline', iconBg: 'rgba(6,182,212,0.1)',   iconBorder: 'rgba(6,182,212,0.2)',   iconColor: '#06B6D4',  Icon: SquareCheckBig },
          { href: '/clients',  label: 'Client List',   iconBg: 'rgba(245,158,11,0.1)',  iconBorder: 'rgba(245,158,11,0.2)',  iconColor: '#F59E0B',  Icon: CalendarDays },
          { href: '/staff',    label: 'Staff',         iconBg: 'rgba(16,185,129,0.1)',  iconBorder: 'rgba(16,185,129,0.2)',  iconColor: '#10B981',  Icon: CalendarDays },
        ].map(({ href, label, iconBg, iconBorder, iconColor, Icon }) => (
          <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', minHeight: 48, background: '#111525', border: '1px solid #1E2340', borderRadius: 12, textDecoration: 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={13} style={{ color: iconColor }} />
            </div>
            <span style={{ fontSize: 11, color: '#D1D5DB' }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
