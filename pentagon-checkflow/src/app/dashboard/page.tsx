'use client'

import AppShell from '@/components/AppShell'
import { useAuth } from '@/lib/auth'
import { MOCK_SESSIONS, SERVICE_PRICING } from '@/lib/mockData'
import { format, isToday } from 'date-fns'
import {
  CalendarDays, Users, DollarSign, CheckSquare,
  ArrowRight, TrendingUp, Clock, AlertCircle, ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'

const STAGE_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  'Setup':              { dot: '#C084FC', bg: 'rgba(192,132,252,0.12)', text: '#C084FC' },
  'Recording Complete': { dot: '#93C5FD', bg: 'rgba(147,197,253,0.12)', text: '#93C5FD' },
  'QC Check':           { dot: '#FDE047', bg: 'rgba(253,224,71,0.12)',  text: '#FDE047' },
  'File Naming':        { dot: '#6EE7B7', bg: 'rgba(110,231,183,0.12)', text: '#6EE7B7' },
  'Upload':             { dot: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  text: '#FCD34D' },
  'Editing':            { dot: '#FCA5A5', bg: 'rgba(252,165,165,0.12)', text: '#FCA5A5' },
  'Ready to Send':      { dot: '#DDD6FE', bg: 'rgba(221,214,254,0.12)', text: '#DDD6FE' },
  'Delivered':          { dot: '#86EFAC', bg: 'rgba(134,239,172,0.12)', text: '#86EFAC' },
}

const paymentColor = (status: string) => {
  if (status === 'Paid in Full')  return { bg: 'rgba(16,185,129,0.12)', text: '#34D399', border: 'rgba(16,185,129,0.25)' }
  if (status === 'Deposit Paid') return { bg: 'rgba(245,158,11,0.12)', text: '#FBBF24', border: 'rgba(245,158,11,0.25)' }
  return { bg: 'rgba(239,68,68,0.10)', text: '#F87171', border: 'rgba(239,68,68,0.25)' }
}

export default function DashboardPage() {
  const { profile, isOwner } = useAuth()

  const upcomingSessions = MOCK_SESSIONS.filter(s => new Date(s.start_time) > new Date())
  const todaySessions    = MOCK_SESSIONS.filter(s => isToday(new Date(s.start_time)))
  const allTasks         = MOCK_SESSIONS.flatMap(s => (s.tasks ?? []).map(t => ({ ...t, session: s })))
  const activeTasks      = allTasks.filter(t => t.status !== 'Delivered')
  const readyTasks       = allTasks.filter(t => t.status === 'Ready to Send')
  const unpaidCount      = MOCK_SESSIONS.filter(s => s.payment_status === 'Unpaid').length

  const totalRevenue = MOCK_SESSIONS.reduce((acc, s) => {
    if (s.payment_status === 'Paid in Full')  return acc + (SERVICE_PRICING[s.service] || 0)
    if (s.payment_status === 'Deposit Paid') return acc + (SERVICE_PRICING[s.service] || 0) * 0.5
    return acc
  }, 0)

  const stats = [
    { label: 'Est. Revenue',       value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign,   accent: '#F59E0B', delta: '+12% vs last mo', deltaUp: true },
    { label: 'Upcoming Sessions',  value: upcomingSessions.length,             icon: CalendarDays, accent: '#8B5CF6', delta: `${todaySessions.length} today`, deltaUp: null },
    { label: 'Active Tasks',       value: activeTasks.length,                  icon: CheckSquare,  accent: '#06B6D4', delta: `${readyTasks.length} ready`, deltaUp: null },
    { label: 'Unpaid Sessions',    value: unpaidCount,                         icon: AlertCircle,  accent: unpaidCount > 0 ? '#EF4444' : '#10B981', delta: unpaidCount > 0 ? 'Action needed' : 'All clear', deltaUp: unpaidCount === 0 },
  ]

  return (
    <AppShell>
      {/* px-4 on mobile, px-6 on desktop */}
      <div className="px-4 md:px-6 py-5 space-y-5" style={{ maxWidth: '1400px' }}>

        {/* Header */}
        <div className="flex items-start justify-between pt-1">
          <div>
            <span className="text-xs font-mono tracking-widest px-2 py-0.5 rounded inline-block mb-1"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
              OWNER DASHBOARD
            </span>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#E8ECF4', letterSpacing: '-0.02em' }}>
              {profile?.email ? `${profile.email.split('@')[0]}'s Studio` : 'Studio Overview'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#4B5563' }}>
              {format(new Date(), 'EEE, MMM d, yyyy')}
            </p>
          </div>
          <Link href="/book"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', minHeight: '44px', whiteSpace: 'nowrap' }}>
            + Book
          </Link>
        </div>

        {/* Stats — 2×2 on mobile, 4×1 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, accent, delta, deltaUp }) => (
            <div key={label} className="rounded-xl p-4 relative overflow-hidden"
              style={{ background: '#111525', border: '1px solid #1E2340' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                  <Icon size={15} style={{ color: accent }} strokeWidth={2} />
                </div>
                <span className="text-xs font-medium leading-tight text-right"
                  style={{ color: deltaUp === true ? '#34D399' : deltaUp === false ? '#F87171' : '#4B5563', maxWidth: '90px' }}>
                  {deltaUp === true && '↑ '}{delta}
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: '#E8ECF4', letterSpacing: '-0.03em' }}>{value}</div>
              <div className="text-xs mt-0.5 leading-tight" style={{ color: '#4B5563' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Sessions + Tasks — stacked on mobile, side-by-side on xl */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* Upcoming Sessions */}
          <div className="xl:col-span-3 rounded-xl overflow-hidden"
            style={{ background: '#111525', border: '1px solid #1E2340' }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #1A1F38' }}>
              <div className="flex items-center gap-2">
                <CalendarDays size={14} style={{ color: '#8B5CF6' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#E8ECF4' }}>Upcoming Sessions</h2>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                  {upcomingSessions.length}
                </span>
              </div>
              <Link href="/calendar" className="flex items-center gap-1 text-xs" style={{ color: '#F59E0B', minHeight: '44px' }}>
                All <ArrowRight size={11} />
              </Link>
            </div>

            <div className="divide-y" style={{ borderColor: '#1A1F38' }}>
              {upcomingSessions.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: '#4B5563' }}>No upcoming sessions</div>
              ) : upcomingSessions.map(session => {
                const pc = paymentColor(session.payment_status)
                return (
                  <Link key={session.id} href={`/sessions/${session.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/5">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold font-mono"
                      style={session.studio === 'Studio A'
                        ? { background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.35)' }
                        : { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                      {session.studio === 'Studio A' ? 'A' : 'B'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: '#E8ECF4' }}>{session.clients.name}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: '#4B5563' }}>{session.service}</div>
                    </div>
                    {/* Hide payment badge on very small screens */}
                    <span className="hidden sm:block text-xs px-2 py-1 rounded-md font-medium flex-shrink-0"
                      style={{ background: pc.bg, color: pc.text, border: `1px solid ${pc.border}` }}>
                      {session.payment_status}
                    </span>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold" style={{ color: '#E8ECF4' }}>
                        {format(new Date(session.start_time), 'MMM d')}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-0.5 justify-end" style={{ color: '#4B5563' }}>
                        <Clock size={9} />
                        {format(new Date(session.start_time), 'h:mm a')}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="px-4 py-3" style={{ borderTop: '1px solid #1A1F38' }}>
              <Link href="/book"
                className="w-full flex items-center justify-center gap-2 rounded-lg text-sm font-semibold"
                style={{ minHeight: '44px', background: 'rgba(109,40,217,0.2)', color: '#A78BFA', border: '1px solid rgba(109,40,217,0.35)' }}>
                + Book New Session
              </Link>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="xl:col-span-2 rounded-xl overflow-hidden"
            style={{ background: '#111525', border: '1px solid #1E2340' }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #1A1F38' }}>
              <div className="flex items-center gap-2">
                <CheckSquare size={14} style={{ color: '#06B6D4' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#E8ECF4' }}>Task Pipeline</h2>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(6,182,212,0.12)', color: '#22D3EE' }}>
                  {activeTasks.length}
                </span>
              </div>
              <Link href="/tasks" className="flex items-center gap-1 text-xs" style={{ color: '#F59E0B', minHeight: '44px' }}>
                Board <ArrowRight size={11} />
              </Link>
            </div>

            <div className="p-3 space-y-2" style={{ maxHeight: '280px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {activeTasks.map(task => {
                const sc = STAGE_COLORS[task.status] || { dot: '#6B7280', bg: 'rgba(107,114,128,0.12)', text: '#9CA3AF' }
                return (
                  <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: '#0C0F1E', border: '1px solid #1A1F38' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: '#D1D5DB' }}>
                        {task.session.clients.name}
                      </div>
                      <div className="text-xs truncate" style={{ color: '#374151' }}>{task.session.service}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0"
                      style={{ background: sc.bg, color: sc.text }}>{task.status}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions — 2×2 on mobile, 4×1 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-2">
          {[
            { label: 'Book Session',   href: '/book',      icon: CalendarDays, accent: '#8B5CF6' },
            { label: 'Task Pipeline',  href: '/tasks',     icon: CheckSquare,  accent: '#06B6D4' },
            { label: 'Client List',    href: '/clients',   icon: Users,        accent: '#F59E0B' },
            { label: 'Employees',      href: '/employees', icon: Users,        accent: '#10B981' },
          ].map(({ label, href, icon: Icon, accent }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: '#111525', border: '1px solid #1E2340', color: '#9CA3AF', minHeight: '52px' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${accent}14`, border: `1px solid ${accent}25` }}>
                <Icon size={14} style={{ color: accent }} />
              </div>
              <span className="text-xs" style={{ color: '#D1D5DB' }}>{label}</span>
            </Link>
          ))}
        </div>

      </div>
    </AppShell>
  )
}
