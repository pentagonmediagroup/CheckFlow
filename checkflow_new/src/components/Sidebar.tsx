'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import {
  LayoutDashboard, CalendarDays, BookOpen, CheckSquare,
  Users, LogOut, Mic2, DollarSign, UserCog
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/book', icon: BookOpen, label: 'Book Session' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/tasks', icon: CheckSquare, label: 'Task Pipeline' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/staff', icon: UserCog, label: 'Staff' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut, isOwner } = useAuth()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{ background: 'linear-gradient(180deg, #1A1030 0%, #0F0A1E 100%)', borderRight: '1px solid #2D1F4E' }}>

      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#2D1F4E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6B21A8, #4C1D95)', boxShadow: '0 0 16px rgba(107,33,168,0.5)' }}>
            <Mic2 size={20} className="text-yellow-400" />
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-none text-white">THE PENTAGON</div>
            <div className="text-xs font-medium" style={{ color: '#EAB308' }}>CheckFlow</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(107,33,168,0.5), rgba(76,29,149,0.3))',
                borderLeft: '3px solid #EAB308', paddingLeft: '10px',
              } : {}}>
              <Icon size={18} className={active ? 'text-yellow-400' : ''} />
              {label}
            </Link>
          )
        })}

        {isOwner && (
          <Link href="/cashflow"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive('/cashflow') ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
            style={isActive('/cashflow') ? {
              background: 'linear-gradient(135deg, rgba(107,33,168,0.5), rgba(76,29,149,0.3))',
              borderLeft: '3px solid #EAB308', paddingLeft: '10px',
            } : {}}>
            <DollarSign size={18} className={isActive('/cashflow') ? 'text-yellow-400' : ''} />
            Cashflow
          </Link>
        )}
      </nav>

      {/* User + Signout */}
      <div className="px-4 py-4 border-t border-[#2D1F4E]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #6B21A8, #EAB308)' }}>
            {profile?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{profile?.email}</div>
            <div className="text-xs capitalize" style={{ color: '#EAB308' }}>{profile?.role}</div>
          </div>
        </div>
        <button onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
