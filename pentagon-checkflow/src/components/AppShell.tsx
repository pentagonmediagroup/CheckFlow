'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, CheckSquare, Users,
  PlusCircle, Settings, LogOut, ChevronLeft, ChevronRight,
  Music2, Menu,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/calendar',   label: 'Calendar',     icon: CalendarDays },
  { href: '/tasks',      label: 'Task Pipeline',icon: CheckSquare },
  { href: '/clients',    label: 'Clients',      icon: Users },
  { href: '/book',       label: 'Book Session', icon: PlusCircle },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen" style={{ background: '#080B14', color: '#E8ECF4' }}>
      {/* ── Sidebar ── */}
      <aside
        className="relative flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          width: collapsed ? '68px' : '232px',
          background: '#0C0F1E',
          borderRight: '1px solid #1A1F38',
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: '1px solid #1A1F38', minHeight: '64px' }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}
          >
            <Music2 size={18} color="#F59E0B" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold tracking-wide" style={{ color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                CHECKFLOW
              </div>
              <div className="text-xs" style={{ color: '#F59E0B', letterSpacing: '0.1em' }}>
                PENTAGON STUDIOS
              </div>
            </div>
          )}
        </div>

        {/* Owner badge */}
        {!collapsed && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }} />
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#F59E0B' }}>OWNER ACCESS</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group relative"
                style={{
                  background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: active ? '#A78BFA' : '#6B7280',
                  borderLeft: active ? '2px solid #8B5CF6' : '2px solid transparent',
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? '#A78BFA' : '#6B7280', flexShrink: 0 }}
                />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: active ? '#E8ECF4' : '#6B7280' }}>
                    {label}
                  </span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                    style={{ background: '#1A1F38', color: '#E8ECF4', border: '1px solid #2A2F50' }}>
                    {label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 pb-4 space-y-0.5" style={{ borderTop: '1px solid #1A1F38', paddingTop: '12px' }}>
          <Link href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group relative"
            style={{ color: '#4B5563' }}>
            <Settings size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span className="text-sm">Settings</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: '#1A1F38', color: '#E8ECF4', border: '1px solid #2A2F50' }}>Settings</div>
            )}
          </Link>
          <button
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group relative"
            style={{ color: '#4B5563' }}>
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[76px] w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
          style={{ background: '#1A1F38', border: '1px solid #2A2F50', color: '#6B7280' }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: '64px', borderBottom: '1px solid #1A1F38', background: '#0C0F1E' }}
        >
          <div className="flex items-center gap-2">
            {/* Breadcrumb path indicator */}
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4B5563' }}>
              {pathname?.split('/').filter(Boolean).join(' / ') || 'home'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
              <span className="text-xs font-medium" style={{ color: '#10B981' }}>LIVE</span>
            </div>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', color: '#F59E0B' }}>
              O
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
