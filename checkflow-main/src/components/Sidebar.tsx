'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import {
  LayoutDashboard, CalendarDays, SquareCheckBig, Users, UserCog,
  CirclePlus, DollarSign, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/calendar',  label: 'Calendar',  Icon: CalendarDays },
  { href: '/tasks',     label: 'Tasks',     Icon: SquareCheckBig },
  { href: '/clients',   label: 'Clients',   Icon: Users },
  { href: '/staff',     label: 'Staff',     Icon: UserCog },
  { href: '/cashflow',  label: 'Cashflow',  Icon: DollarSign, isNew: true },
  { href: '/book',      label: 'Book',      Icon: CirclePlus },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      style={{
        width: collapsed ? 64 : 232,
        background: '#0C0F1E',
        borderRight: '1px solid #1A1F38',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 300ms',
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px', borderBottom: '1px solid #1A1F38', minHeight: 70, overflow: 'hidden' }}>
        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#F59E0B', flexShrink: 0 }}>P</div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>STUDIOFLOW</div>
            <div style={{ fontSize: 10, color: '#F59E0B', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>THE PENTAGON</div>
          </div>
        )}
      </div>

      {/* Owner badge */}
      {!collapsed && (
        <div style={{ margin: '8px 10px', padding: '6px 10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.1em' }}>OWNER ACCESS</span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, Icon, isNew }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '0 10px' : '0 10px',
              minHeight: 42, borderRadius: 8,
              borderLeft: active ? '2px solid #8B5CF6' : '2px solid transparent',
              background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
              textDecoration: 'none', transition: 'background 0.15s',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}>
              <Icon size={17} style={{ color: active ? '#A78BFA' : '#6B7280', flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontSize: 13, fontWeight: 500, color: active ? '#E8ECF4' : '#6B7280', whiteSpace: 'nowrap' }}>
                  {label}
                  {isNew && <span style={{ marginLeft: 6, fontSize: 8, background: 'rgba(16,185,129,0.2)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, padding: '1px 4px', fontWeight: 700, letterSpacing: '0.05em' }}>NEW</span>}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1A1F38', padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 38, padding: '0 10px', borderRadius: 8, color: '#4B5563', textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <Settings size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 13 }}>Settings</span>}
        </Link>
        <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 38, padding: '0 10px', borderRadius: 8, color: '#4B5563', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 13 }}>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ position: 'absolute', right: -12, top: 80, width: 24, height: 24, borderRadius: '50%', background: '#1A1F38', border: '1px solid #2A2F50', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  )
}
