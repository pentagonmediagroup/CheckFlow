'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import Link from 'next/link'

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/calendar':  'calendar',
  '/tasks':     'tasks',
  '/clients':   'clients',
  '/staff':     'staff',
  '/cashflow':  'cashflow',
  '/book':      'book',
  '/settings':  'settings',
}

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/calendar',  label: 'Calendar' },
  { href: '/tasks',     label: 'Tasks' },
  { href: '/clients',   label: 'Clients' },
  { href: '/staff',     label: 'Staff' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const label = Object.entries(PAGE_LABELS).find(([k]) => pathname.startsWith(k))?.[1] ?? ''

  // Don't show shell on login page
  if (pathname === '/login' || pathname === '/') return <>{children}</>

  return (
    <div style={{ background: '#080B14', color: '#E8ECF4', minHeight: '100dvh' }}>
      {/* Desktop layout */}
      <div className="hidden md:flex" style={{ minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Topbar */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 70, borderBottom: '1px solid #1A1F38', background: '#0C0F1E', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.12em', color: '#4B5563', textTransform: 'uppercase' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>LIVE</span>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>O</div>
            </div>
          </header>
          <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col md:hidden" style={{ minHeight: '100dvh' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', paddingTop: 'env(safe-area-inset-top)', height: 56, background: '#0C0F1E', borderBottom: '1px solid #1A1F38', zIndex: 30, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#F59E0B' }}>P</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.06em' }}>STUDIOFLOW</div>
              <div style={{ fontSize: 9, color: '#F59E0B', letterSpacing: '0.08em' }}>THE PENTAGON</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981' }}>LIVE</span>
            </div>
            <button onClick={() => setMobileOpen(o => !o)} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#111525', color: '#9CA3AF', border: 'none', cursor: 'pointer' }}>
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setMobileOpen(false)}>
            <div style={{ position: 'absolute', top: 56, left: 0, bottom: 0, width: 240, background: '#0C0F1E', borderRight: '1px solid #1A1F38', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }} onClick={e => e.stopPropagation()}>
              {MOBILE_NAV.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: pathname.startsWith(href) ? '#E8ECF4' : '#6B7280', background: pathname.startsWith(href) ? 'rgba(139,92,246,0.15)' : 'transparent', textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
              <Link href="/cashflow" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: pathname === '/cashflow' ? '#E8ECF4' : '#6B7280', background: pathname === '/cashflow' ? 'rgba(139,92,246,0.15)' : 'transparent', textDecoration: 'none' }}>Cashflow <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.2)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, padding: '1px 4px', fontWeight: 700, marginLeft: 4 }}>NEW</span></Link>
            </div>
          </div>
        )}

        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>{children}</main>

        {/* Bottom nav */}
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, display: 'flex', alignItems: 'stretch', background: '#0C0F1E', borderTop: '1px solid #1A1F38', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {MOBILE_NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 8, paddingBottom: 4, minHeight: 56, textDecoration: 'none', position: 'relative' }}>
                {active && <div style={{ position: 'absolute', top: 0, width: 28, height: 2, background: '#8B5CF6', borderRadius: '0 0 2px 2px' }} />}
                <span style={{ fontSize: 9, fontWeight: active ? 600 : 400, color: active ? '#A78BFA' : '#4B5563' }}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
