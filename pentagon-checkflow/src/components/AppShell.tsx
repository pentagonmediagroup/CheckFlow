'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, CalendarDays, CheckSquare, Users,
  PlusCircle, Settings, LogOut, ChevronLeft, ChevronRight,
  UserCog, Menu, X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/calendar',   label: 'Calendar',      icon: CalendarDays },
  { href: '/tasks',      label: 'Tasks',         icon: CheckSquare },
  { href: '/clients',    label: 'Clients',       icon: Users },
  { href: '/employees',  label: 'Staff',         icon: UserCog },
  { href: '/book',       label: 'Book',          icon: PlusCircle },
]

// Bottom nav shows 5 most-used items on mobile
const BOTTOM_NAV = NAV_ITEMS.slice(0, 5)

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))

  return (
    <div style={{ background: '#080B14', color: '#E8ECF4', minHeight: '100dvh' }}>

      {/* ─── DESKTOP LAYOUT ─── (md and above) */}
      <div className="hidden md:flex min-h-screen">

        {/* Sidebar */}
        <aside className="relative flex flex-col flex-shrink-0 transition-all duration-300"
          style={{ width: collapsed ? '68px' : '232px', background: '#0C0F1E', borderRight: '1px solid #1A1F38' }}>

          {/* Brand */}
          <div className="flex items-center gap-3 px-3 py-4"
            style={{ borderBottom: '1px solid #1A1F38', minHeight: '70px' }}>
            <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center">
              <Image src="/pentagon-logo.png" alt="The Pentagon" width={44} height={44} style={{ objectFit: 'contain' }} />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-bold whitespace-nowrap"
                  style={{ color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.06em' }}>STUDIOFLOW</div>
                <div className="text-xs whitespace-nowrap" style={{ color: '#F59E0B', letterSpacing: '0.1em' }}>THE PENTAGON</div>
              </div>
            )}
          </div>

          {/* Owner badge */}
          {!collapsed && (
            <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg flex items-center gap-2"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} />
              <span className="text-xs font-bold tracking-widest" style={{ color: '#F59E0B' }}>OWNER ACCESS</span>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} title={collapsed ? label : undefined}
                  className="flex items-center gap-3 rounded-lg px-3 transition-all group relative"
                  style={{
                    minHeight: '44px',
                    background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                    borderLeft: active ? '2px solid #8B5CF6' : '2px solid transparent',
                  }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2}
                    style={{ color: active ? '#A78BFA' : '#6B7280', flexShrink: 0 }} />
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap"
                      style={{ color: active ? '#E8ECF4' : '#6B7280' }}>{label}</span>
                  )}
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

          {/* Footer */}
          <div className="px-2 pb-4 space-y-0.5" style={{ borderTop: '1px solid #1A1F38', paddingTop: '12px' }}>
            <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3"
              style={{ minHeight: '44px', color: '#4B5563' }}>
              <Settings size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span className="text-sm">Settings</span>}
            </Link>
            <button className="w-full flex items-center gap-3 rounded-lg px-3" style={{ minHeight: '44px', color: '#4B5563' }}>
              <LogOut size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span className="text-sm">Sign Out</span>}
            </button>
          </div>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-10"
            style={{ background: '#1A1F38', border: '1px solid #2A2F50', color: '#6B7280' }}>
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </aside>

        {/* Desktop main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-6 flex-shrink-0"
            style={{ height: '70px', borderBottom: '1px solid #1A1F38', background: '#0C0F1E' }}>
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4B5563' }}>
              {pathname?.split('/').filter(Boolean).join(' / ') || 'home'}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-xs font-bold" style={{ color: '#10B981' }}>LIVE</span>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', color: '#F59E0B' }}>O</div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* ─── MOBILE LAYOUT ─── (below md) */}
      <div className="flex flex-col md:hidden" style={{ minHeight: '100dvh' }}>

        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 flex-shrink-0 z-30"
          style={{
            height: '56px',
            background: '#0C0F1E',
            borderBottom: '1px solid #1A1F38',
            paddingTop: 'env(safe-area-inset-top)',
          }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image src="/pentagon-logo.png" alt="The Pentagon" width={32} height={32} style={{ objectFit: 'contain' }} />
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.06em' }}>STUDIOFLOW</div>
              <div className="text-xs" style={{ color: '#F59E0B', fontSize: '9px', letterSpacing: '0.08em' }}>THE PENTAGON</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
              <span style={{ color: '#10B981', fontSize: '10px', fontWeight: 700 }}>LIVE</span>
            </div>
            {/* Hamburger for full menu */}
            <button onClick={() => setMobileMenu(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ background: '#111525', color: '#9CA3AF' }}>
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* Mobile slide-out menu */}
        {mobileMenu && (
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileMenu(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-72 flex flex-col"
              style={{ background: '#0C0F1E', borderLeft: '1px solid #1A1F38', paddingTop: 'env(safe-area-inset-top)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1A1F38' }}>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#E8ECF4', fontFamily: 'monospace' }}>STUDIOFLOW</div>
                  <div className="text-xs" style={{ color: '#F59E0B' }}>THE PENTAGON</div>
                </div>
                <button onClick={() => setMobileMenu(false)} className="w-10 h-10 flex items-center justify-center rounded-lg"
                  style={{ color: '#6B7280', background: '#1A1F38' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Owner badge */}
              <div className="mx-4 mt-3 mb-1 px-3 py-2 rounded-lg flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                <span className="text-xs font-bold tracking-widest" style={{ color: '#F59E0B' }}>OWNER ACCESS</span>
              </div>

              <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link key={href} href={href} onClick={() => setMobileMenu(false)}
                      className="flex items-center gap-3 rounded-xl px-4"
                      style={{
                        minHeight: '52px',
                        background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                        borderLeft: active ? '3px solid #8B5CF6' : '3px solid transparent',
                      }}>
                      <Icon size={20} strokeWidth={active ? 2.5 : 2}
                        style={{ color: active ? '#A78BFA' : '#6B7280', flexShrink: 0 }} />
                      <span className="text-base font-medium" style={{ color: active ? '#E8ECF4' : '#6B7280' }}>{label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="px-3 pb-6 space-y-1" style={{ borderTop: '1px solid #1A1F38', paddingTop: '12px', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
                <Link href="/settings" onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 rounded-xl px-4" style={{ minHeight: '52px', color: '#4B5563' }}>
                  <Settings size={20} style={{ flexShrink: 0 }} />
                  <span className="text-base">Settings</span>
                </Link>
                <button className="w-full flex items-center gap-3 rounded-xl px-4" style={{ minHeight: '52px', color: '#4B5563' }}>
                  <LogOut size={20} style={{ flexShrink: 0 }} />
                  <span className="text-base">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile content — scrollable, padded for bottom nav */}
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
          style={{
            background: '#0C0F1E',
            borderTop: '1px solid #1A1F38',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1"
                style={{ minHeight: '56px' }}>
                <Icon size={22} strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? '#A78BFA' : '#4B5563' }} />
                <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? '#A78BFA' : '#4B5563' }}>
                  {label}
                </span>
                {active && (
                  <div className="absolute top-0 h-0.5 w-8 rounded-full" style={{ background: '#8B5CF6' }} />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
