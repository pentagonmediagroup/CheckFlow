'use client'

import AppShell from '@/components/AppShell'
import { useAuth } from '@/lib/auth'
import { MOCK_SESSIONS, SERVICE_PRICING } from '@/lib/mockData'
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns'
import { CalendarDays, Users, DollarSign, CheckSquare, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile, isOwner } = useAuth()

  const upcomingSessions = MOCK_SESSIONS.filter(s => new Date(s.start_time) > new Date())
  const todaySessions = MOCK_SESSIONS.filter(s => isToday(new Date(s.start_time)))
  
  const totalRevenue = MOCK_SESSIONS.reduce((acc, s) => {
    if (s.payment_status === 'Paid in Full') return acc + (SERVICE_PRICING[s.service] || 0)
    if (s.payment_status === 'Deposit Paid') return acc + (SERVICE_PRICING[s.service] || 0) * 0.5
    return acc
  }, 0)

  const activeTasks = MOCK_SESSIONS.flatMap(s => s.tasks).filter(t => t.status !== 'Delivered')

  const stats = [
    { label: 'Upcoming Sessions', value: upcomingSessions.length, icon: CalendarDays, color: '#6B21A8' },
    { label: 'Active Tasks', value: activeTasks.length, icon: CheckSquare, color: '#7C3AED' },
    { label: 'Total Clients', value: 4, icon: Users, color: '#EAB308' },
    ...(isOwner ? [{ label: 'Revenue (Est.)', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#22C55E' }] : []),
  ]

  const getStageColor = (stage: string) => {
    const map: Record<string, string> = {
      'Setup': '#C084FC', 'Recording Complete': '#93C5FD', 'QC Check': '#FDE047',
      'File Naming': '#6EE7B7', 'Upload': '#FCD34D', 'Editing': '#FCA5A5',
      'Ready to Send': '#DDD6FE', 'Delivered': '#86EFAC',
    }
    return map[stage] || '#9CA3AF'
  }

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            Welcome back{profile?.email ? `, ${profile.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-gray-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • Studio Operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-5"
              style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}22` }}>
                  <Icon size={20} style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white font-display">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <div className="rounded-xl" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D1F4E]">
              <h2 className="font-display text-lg font-semibold text-white">Upcoming Sessions</h2>
              <Link href="/calendar" className="text-xs hover:text-white transition-colors flex items-center gap-1"
                style={{ color: '#EAB308' }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {upcomingSessions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No upcoming sessions</p>
              ) : upcomingSessions.map(session => (
                <Link key={session.id} href={`/sessions/${session.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-display font-bold text-sm"
                    style={{ background: session.studio === 'Studio A' ? 'rgba(107,33,168,0.4)' : 'rgba(234,179,8,0.2)', color: session.studio === 'Studio A' ? '#C084FC' : '#FDE047' }}>
                    {session.studio === 'Studio A' ? 'A' : 'B'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{session.clients.name}</div>
                    <div className="text-xs text-gray-500 truncate">{session.service}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-medium text-white">{format(new Date(session.start_time), 'MMM d')}</div>
                    <div className="text-xs text-gray-500">{format(new Date(session.start_time), 'h:mm a')}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="px-4 pb-4">
              <Link href="/book"
                className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #6B21A8, #4C1D95)', color: '#EAB308' }}>
                + Book New Session
              </Link>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="rounded-xl" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D1F4E]">
              <h2 className="font-display text-lg font-semibold text-white">Active Tasks</h2>
              <Link href="/tasks" className="text-xs hover:text-white transition-colors flex items-center gap-1"
                style={{ color: '#EAB308' }}>
                Pipeline <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {MOCK_SESSIONS.map(session => (
                session.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2D1F4E' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{session.clients.name}</div>
                      <div className="text-xs text-gray-500">{session.service}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: `${getStageColor(task.status)}22`, color: getStageColor(task.status) }}>
                      {task.status}
                    </span>
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: 'New Booking', href: '/book', icon: CalendarDays },
            { label: 'Task Pipeline', href: '/tasks', icon: CheckSquare },
            { label: 'Client List', href: '/clients', icon: Users },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all hover:border-purple-600"
              style={{ background: '#1A1030', border: '1px solid #2D1F4E', color: '#D1D5DB' }}>
              <Icon size={18} style={{ color: '#EAB308' }} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
