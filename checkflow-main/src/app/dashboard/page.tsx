'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CalendarDays, SquareCheckBig, DollarSign, CircleAlert, ArrowRight, Clock, Users, UserCog } from 'lucide-react'

export default function DashboardPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [cashflow, setCashflow] = useState({ collected: 0, owed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const [{ data: se }, { data: ta }, { data: st }] = await Promise.all([
        supabase.from('sessions').select('*').gte('date', today).order('date').limit(5),
        supabase.from('tasks').select('*').order('created_at').limit(10),
        supabase.from('staff').select('id,name,status,roles(name)').order('name').limit(6),
      ])
      const { data: cf } = await supabase.from('sessions').select('amount_owed,amount_paid,late_fee')
      const collected = (cf || []).reduce((s: number, r: any) => s + (r.amount_paid || 0), 0)
      const owed = (cf || []).reduce((s: number, r: any) => s + Math.max(0, (r.amount_owed || 0) - (r.amount_paid || 0) + (r.late_fee || 0)), 0)
      setSessions(se || [])
      setTasks(ta || [])
      setStaff(st || [])
      setCashflow({ collected, owed })
      setLoading(false)
    }
    load()
  }, [])

  const unpaid = sessions.filter(s => s.payment_status === 'Unpaid').length
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  const TASK_COLORS = ['#A78BFA','#60A5FA','#34D399','#FDE047','#FB923C','#F87171','#C084FC','#22D3EE','#FCD34D','#6EE7B7']

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', display: 'inline-block', marginBottom: 4 }}>OWNER DASHBOARD</span>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Studio Overview</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{today}</p>
        </div>
        <Link href="/book" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 24px rgba(107,33,168,0.4)' }}>⚡ Book Session</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Collected', value: `$${cashflow.collected.toFixed(0)}`, sub: 'all time', Icon: DollarSign, c: '#34D399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Upcoming', value: String(sessions.length), sub: 'sessions', Icon: CalendarDays, c: '#A78BFA', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.2)' },
          { label: 'Pipeline', value: String(tasks.length), sub: 'active tasks', Icon: SquareCheckBig, c: '#22D3EE', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.2)' },
          { label: 'Outstanding', value: `$${cashflow.owed.toFixed(0)}`, sub: unpaid > 0 ? `${unpaid} unpaid` : 'all clear', Icon: CircleAlert, c: cashflow.owed > 0 ? '#F87171' : '#34D399', bg: cashflow.owed > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)', border: cashflow.owed > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' },
        ].map(({ label, value, sub, Icon, c, bg, border }) => (
          <div key={label} style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} style={{ color: c }} />
              </div>
              <span style={{ fontSize: 11, color: '#4B5563' }}>{sub}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{loading ? '…' : value}</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Middle: Sessions + Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Sessions */}
        <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #2D1F4E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={14} style={{ color: '#8B5CF6' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>Upcoming Sessions</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', fontFamily: 'monospace' }}>{sessions.length}</span>
            </div>
            <Link href="/calendar" style={{ fontSize: 11, color: '#EAB308', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>All <ArrowRight size={11} /></Link>
          </div>
          {sessions.length === 0 && !loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#4B5563', fontSize: 13 }}>No upcoming sessions</div>
          )}
          {sessions.slice(0, 4).map(s => (
            <Link key={s.id} href={`/sessions/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #1A1F38', textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
                {s.client_name?.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.client_name}</div>
                <div style={{ fontSize: 11, color: '#4B5563', marginTop: 1 }}>{s.session_type} · {s.studio}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 7px', borderRadius: 5, fontWeight: 500, flexShrink: 0, background: s.payment_status === 'Unpaid' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.12)', color: s.payment_status === 'Unpaid' ? '#F87171' : '#34D399', border: `1px solid ${s.payment_status === 'Unpaid' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` }}>{s.payment_status}</span>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#E8ECF4' }}>{s.date}</div>
                <div style={{ fontSize: 10, color: '#4B5563', marginTop: 1, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}><Clock size={9} />{s.start_time?.slice(0,5)}</div>
              </div>
            </Link>
          ))}
          <div style={{ padding: '10px 16px' }}>
            <Link href="/book" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 36, background: 'rgba(109,40,217,0.15)', color: '#A78BFA', border: '1px solid rgba(109,40,217,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Book New Session</Link>
          </div>
        </div>

        {/* Tasks */}
        <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #2D1F4E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SquareCheckBig size={14} style={{ color: '#06B6D4' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>Task Pipeline</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(6,182,212,0.12)', color: '#22D3EE', fontFamily: 'monospace' }}>{tasks.length}</span>
            </div>
            <Link href="/tasks" style={{ fontSize: 11, color: '#EAB308', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>Board <ArrowRight size={11} /></Link>
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 300, overflowY: 'auto' }}>
            {tasks.length === 0 && !loading && <div style={{ padding: '24px', textAlign: 'center', color: '#4B5563', fontSize: 13 }}>No tasks yet</div>}
            {tasks.map((t, i) => {
              const color = TASK_COLORS[i % TASK_COLORS.length]
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 8, borderLeft: `3px solid ${color}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#D1D5DB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.client_name}</div>
                    <div style={{ fontSize: 10, color: '#374151' }}>{t.task_type}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, fontWeight: 500, background: `${color}20`, color, whiteSpace: 'nowrap', flexShrink: 0 }}>{t.stage}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Staff availability */}
      <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCog size={14} style={{ color: '#EAB308' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>Staff On Deck</span>
          </div>
          <Link href="/staff" style={{ fontSize: 11, color: '#EAB308', textDecoration: 'none' }}>Manage →</Link>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {staff.length === 0 && !loading && <span style={{ fontSize: 13, color: '#4B5563' }}>No staff added yet</span>}
          {staff.map(s => {
            const statusColor = s.status === 'Available' ? '#34D399' : s.status === 'In Session' ? '#A78BFA' : '#6B7280'
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 20 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#E8ECF4', fontWeight: 500 }}>{s.name}</span>
                {s.roles?.name && <span style={{ fontSize: 10, color: '#4B5563' }}>{s.roles.name}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { href: '/book',     label: 'Book Session',  Icon: CalendarDays, c: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
          { href: '/tasks',    label: 'Task Pipeline', Icon: SquareCheckBig, c: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)' },
          { href: '/clients',  label: 'Clients',       Icon: Users, c: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
          { href: '/cashflow', label: 'Cashflow',      Icon: DollarSign, c: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
        ].map(({ href, label, Icon, c, bg, border }) => (
          <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', minHeight: 50, background: '#1A1030', border: `1px solid #2D1F4E`, borderRadius: 12, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={14} style={{ color: c }} />
            </div>
            <span style={{ fontSize: 12, color: '#D1D5DB', fontWeight: 500 }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
