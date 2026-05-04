'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'
import { usePathname } from 'next/navigation'
import { Menu, LayoutDashboard, CalendarDays, SquareCheckBig, Users, UserCog } from 'lucide-react'
import Link from 'next/link'

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'dashboard', '/calendar': 'calendar', '/tasks': 'tasks',
  '/clients': 'clients', '/staff': 'staff', '/cashflow': 'cashflow',
  '/book': 'book', '/settings': 'settings', '/sessions': 'session',
}

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/calendar',  label: 'Calendar',  Icon: CalendarDays },
  { href: '/tasks',     label: 'Tasks',     Icon: SquareCheckBig },
  { href: '/clients',   label: 'Clients',   Icon: Users },
  { href: '/staff',     label: 'Staff',     Icon: UserCog },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const label = Object.entries(PAGE_LABELS).find(([k]) => pathname.startsWith(k))?.[1] ?? ''

  if (pathname === '/login' || pathname === '/') return <>{children}</>

  return (
    <div style={{ background: '#080B14', color: '#E8ECF4', minHeight: '100dvh' }}>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-6 flex-shrink-0"
            style={{ height: 70, borderBottom: '1px solid #1A1F38', background: '#0C0F1E' }}>
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4B5563' }}>{label}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-xs font-bold" style={{ color: '#10B981' }}>LIVE</span>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', color: '#EAB308' }}>O</div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="flex flex-col md:hidden" style={{ minHeight: '100dvh' }}>
        {/* Mobile topbar */}
        <header className="flex items-center justify-between px-4 flex-shrink-0 z-30"
          style={{ height: 56, background: '#0C0F1E', borderBottom: '1px solid #1A1F38', paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center gap-2.5">
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#EAB308' }}>P</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.06em' }}>STUDIOFLOW</div>
              <div style={{ fontSize: 9, color: '#EAB308', letterSpacing: '0.08em' }}>THE PENTAGON</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
              <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>LIVE</span>
            </div>
            <button onClick={() => setMobileOpen(o => !o)}
              className="w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ background: '#111525', color: '#9CA3AF', border: 'none', cursor: 'pointer' }}>
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* Mobile drawer overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50" onClick={() => setMobileOpen(false)}
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'absolute', top: 56, left: 0, bottom: 0, width: 260, background: '#0C0F1E', borderRight: '1px solid #1A1F38', padding: 12, overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              {[
                { href: '/dashboard', label: 'Dashboard' }, { href: '/calendar', label: 'Calendar' },
                { href: '/tasks', label: 'Tasks' }, { href: '/clients', label: 'Clients' },
                { href: '/staff', label: 'Staff' }, { href: '/cashflow', label: 'Cashflow' },
                { href: '/book', label: '⚡ Book Session' }, { href: '/settings', label: 'Settings' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'block', padding: '12px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: pathname.startsWith(href) ? '#E8ECF4' : '#6B7280', background: pathname.startsWith(href) ? 'rgba(139,92,246,0.15)' : 'transparent', textDecoration: 'none', marginBottom: 2 }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
          {children}
        </main>

        {/* Mobile bottom nav with icons */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
          style={{ background: '#0C0F1E', borderTop: '1px solid #1A1F38', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {BOTTOM_NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1"
                style={{ minHeight: 56, textDecoration: 'none', position: 'relative' }}>
                {active && <div style={{ position: 'absolute', top: 0, width: 28, height: 2, background: '#8B5CF6', borderRadius: '0 0 2px 2px' }} />}
                <Icon size={22} style={{ color: active ? '#A78BFA' : '#4B5563' }} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#A78BFA' : '#4B5563' }}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
