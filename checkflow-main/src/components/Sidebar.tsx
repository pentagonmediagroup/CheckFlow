'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  { href: '/cashflow',  label: 'Cashflow',  Icon: DollarSign },
  { href: '/book',      label: 'Book',      Icon: CirclePlus },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className="relative flex flex-col flex-shrink-0 transition-all duration-300"
      style={{ width: collapsed ? 64 : 232, background: '#0C0F1E', borderRight: '1px solid #1A1F38' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4" style={{ borderBottom: '1px solid #1A1F38', minHeight: 70 }}>
        <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
          style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', borderRadius: 10, display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:18,color:'#EAB308',flexShrink:0 }}>P</div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold whitespace-nowrap" style={{ color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.06em' }}>STUDIOFLOW</div>
            <div className="text-xs whitespace-nowrap" style={{ color: '#EAB308', letterSpacing: '0.1em' }}>THE PENTAGON</div>
          </div>
        )}
      </div>

      {/* Owner badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#EAB308' }} />
          <span className="text-xs font-bold tracking-widest" style={{ color: '#EAB308' }}>OWNER ACCESS</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 rounded-lg px-3 transition-all group relative"
              style={{
                minHeight: 44,
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                borderLeft: active ? '2px solid #8B5CF6' : '2px solid transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
              }}>
              <Icon size={18} style={{ color: active ? '#A78BFA' : '#6B7280', flexShrink: 0 }} />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap" style={{ color: active ? '#E8ECF4' : '#6B7280' }}>{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 space-y-0.5" style={{ borderTop: '1px solid #1A1F38', paddingTop: 12 }}>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3"
          style={{ minHeight: 44, color: '#4B5563', textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <Settings size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span className="text-sm">Settings</span>}
        </Link>
        <button onClick={() => router.push('/login')}
          className="w-full flex items-center gap-3 rounded-lg px-3"
          style={{ minHeight: 44, color: '#4B5563', background: 'transparent', border: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-10"
        style={{ background: '#1A1F38', border: '1px solid #2A2F50', color: '#6B7280' }}>
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  )
}
