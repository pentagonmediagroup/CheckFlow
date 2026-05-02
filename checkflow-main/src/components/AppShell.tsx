'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { LayoutDashboard, CalendarDays, BookOpen, CheckSquare, Users, UserCog } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'

const mobileNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/staff', icon: UserCog, label: 'Staff' },
  { href: '/book', icon: BookOpen, label: 'Book' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const segment = pathname.split('/').filter(Boolean)[0] || 'dashboard'

  return (
    <div className="min-h-screen" style={{ background: '#0F0A1E' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile top header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: '#1A1030', borderBottom: '1px solid #2D1F4E' }}>
        <div className="flex items-center gap-2">
          <Image src="/pentagon-logo.png" alt="The Pentagon" width={32} height={32} className="rounded" />
          <div>
            <div className="text-[9px] font-bold tracking-widest text-gray-500 leading-none">STUDIOFLOW</div>
            <div className="font-display text-sm font-bold text-white leading-none">THE PENTAGON</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded"
            style={{ background: '#2D1F4E', color: '#9CA3AF' }}>{segment}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }}>LIVE</span>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,#6B21A8,#EAB308)', color: '#000' }}>
            {profile?.email?.[0]?.toUpperCase() ?? 'O'}
          </div>
        </div>
      </header>

      {/* Main content — offset by sidebar on desktop, bottom nav on mobile */}
      <main className="md:pl-64 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 py-1"
        style={{ background: '#1A1030', borderTop: '1px solid #2D1F4E' }}>
        {mobileNav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all"
              style={{ color: active ? '#EAB308' : '#6B7280' }}>
              <Icon size={19} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
