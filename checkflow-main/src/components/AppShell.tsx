'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, CalendarDays, CheckSquare, Users,
  UserCog, CirclePlus, DollarSign, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'

const StudioFlowLogo = ({ size = 44 }: { size?: number }) => (
  <div style={{ width:size, height:size, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
    <img src="/logo.jpg" alt="StudioFlow" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
  </div>
)

const ALL_NAV = [
  { href:'/dashboard', label:'Dashboard', Icon:LayoutDashboard },
  { href:'/calendar',  label:'Calendar',  Icon:CalendarDays },
  { href:'/tasks',     label:'Tasks',     Icon:CheckSquare },
  { href:'/clients',   label:'Clients',   Icon:Users },
  { href:'/staff',     label:'Staff',     Icon:UserCog },
  { href:'/book',      label:'Book',      Icon:CirclePlus },
  { href:'/cashflow',  label:'Cashflow',  Icon:DollarSign, ownerOnly:true },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') router.replace('/login')
  }, [loading, user, pathname])

  if (pathname === '/login') return <>{children}</>
  if (loading || !user) return (
    <div style={{minHeight:'100dvh',background:'#080B14',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <StudioFlowLogo size={60}/>
    </div>
  )

  const nav = ALL_NAV.filter(n => !n.ownerOnly || user.role === 'owner')
  const mobileNav = nav.slice(0, 5)

  const SidebarLink = ({ href, label, Icon }: any) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link href={href} onClick={() => setMobileOpen(false)}
        className={`nav-link${active?' active':''}`}
        style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <Icon size={17} style={{ color: active ? '#A78BFA' : '#6B7280', flexShrink: 0 }} />
        {!collapsed && <span style={{ fontSize:13, fontWeight:500, color: active ? '#E8ECF4' : '#6B7280' }}>{label}</span>}
      </Link>
    )
  }

  const sidebar = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', position:'relative' }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px', borderBottom:'1px solid #2D1F4E', minHeight:70 }}>
        <StudioFlowLogo size={44}/>
        {!collapsed && (
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:12,fontWeight:700,color:'#E8ECF4',fontFamily:'monospace',letterSpacing:'.06em',whiteSpace:'nowrap' }}>STUDIOFLOW</div>
            <div style={{ fontSize:9,color:'#EAB308',letterSpacing:'.1em',whiteSpace:'nowrap' }}>THE PENTAGON</div>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div style={{ margin:'8px 10px', padding:'5px 10px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:8, display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:6,height:6,borderRadius:'50%',background:'#EAB308',flexShrink:0 }} />
          <span style={{ fontSize:9,fontWeight:700,color:'#EAB308',letterSpacing:'.1em',textTransform:'uppercase' }}>
            {user.role === 'owner' ? 'Owner Access' : user.username}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:'6px 8px', display:'flex', flexDirection:'column', gap:2 }}>
        {nav.map(n => <SidebarLink key={n.href} {...n} />)}
      </nav>

      {/* Footer */}
      <div style={{ borderTop:'1px solid #2D1F4E', padding:8, display:'flex', flexDirection:'column', gap:2 }}>
        {user.role==='owner' && <Link href="/settings" className="nav-link" style={{ color:'#4B5563', justifyContent:collapsed?'center':'flex-start' }}>
          <Settings size={16} style={{ flexShrink:0 }} />
          {!collapsed && <span style={{ fontSize:13 }}>Settings</span>}
        </Link>
        }
        <button onClick={() => { logout(); router.push('/login') }}
          className="nav-link" style={{ background:'none', border:'none', cursor:'pointer', color:'#4B5563', width:'100%', justifyContent:collapsed?'center':'flex-start' }}>
          <LogOut size={16} style={{ flexShrink:0 }} />
          {!collapsed && <span style={{ fontSize:13 }}>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(c => !c)}
        style={{ position:'absolute', right:-12, top:80, width:24, height:24, borderRadius:'50%', background:'#1A1F38', border:'1px solid #2D1F4E', color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:10 }}>
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  )

  const label = nav.find(n => pathname.startsWith(n.href))?.label ?? ''

  return (
    <div style={{ background:'#080B14', color:'#E8ECF4', minHeight:'100dvh' }}>
      {/* ── DESKTOP ── */}
      <div className="hidden md:flex" style={{ minHeight:'100vh' }}>
        <aside style={{ width:collapsed?64:232, background:'#0C0F1E', borderRight:'1px solid #2D1F4E', flexShrink:0, transition:'width 250ms ease', overflow:'hidden' }}>
          {sidebar}
        </aside>
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:60, background:'#0C0F1E', borderBottom:'1px solid #2D1F4E', flexShrink:0 }}>
            <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:'.12em', color:'#4B5563', textTransform:'uppercase' }}>{label}</span>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)' }}>
                <div style={{ width:5,height:5,borderRadius:'50%',background:'#10B981' }} />
                <span style={{ fontSize:10,fontWeight:700,color:'#10B981' }}>LIVE</span>
              </div>
              <StudioFlowLogo size={30}/>
            </div>
          </header>
          <main style={{ flex:1, overflowY:'auto' }}>{children}</main>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="flex flex-col md:hidden" style={{ minHeight:'100dvh' }}>
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:56, background:'#0C0F1E', borderBottom:'1px solid #2D1F4E', flexShrink:0, paddingTop:'env(safe-area-inset-top)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <StudioFlowLogo size={36}/>
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:'#E8ECF4',fontFamily:'monospace',letterSpacing:'.06em' }}>STUDIOFLOW</div>
              <div style={{ fontSize:9,color:'#EAB308',letterSpacing:'.08em' }}>THE PENTAGON</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:999, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)' }}>
              <div style={{ width:5,height:5,borderRadius:'50%',background:'#10B981' }} />
              <span style={{ fontSize:9,fontWeight:700,color:'#10B981' }}>LIVE</span>
            </div>
            <button onClick={() => setMobileOpen(o => !o)} style={{ width:38,height:38,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,background:'#111525',color:'#9CA3AF',border:'none',cursor:'pointer' }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div style={{ position:'fixed',inset:0,zIndex:50,background:'rgba(0,0,0,.6)' }} onClick={() => setMobileOpen(false)}>
            <div style={{ position:'absolute',top:56,left:0,bottom:0,width:260,background:'#0C0F1E',borderRight:'1px solid #2D1F4E',overflowY:'auto',padding:10 }} onClick={e => e.stopPropagation()}>
              {nav.map(n => <SidebarLink key={n.href} {...n} />)}
              <div style={{ borderTop:'1px solid #2D1F4E', marginTop:8, paddingTop:8 }}>
                <button onClick={() => { logout(); router.push('/login') }} style={{ width:'100%', padding:'10px 14px', background:'rgba(239,68,68,.08)', color:'#F87171', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, fontSize:13, cursor:'pointer' }}>Sign Out</button>
              </div>
            </div>
          </div>
        )}

        <main style={{ flex:1, overflowY:'auto', paddingBottom:'calc(72px + env(safe-area-inset-bottom))', WebkitOverflowScrolling:'touch' as any }}>{children}</main>

        <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:40, display:'flex', background:'#0C0F1E', borderTop:'1px solid #2D1F4E', paddingBottom:'env(safe-area-inset-bottom)', boxShadow:'0 -4px 20px rgba(0,0,0,.4)' }}>
          {mobileNav.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, paddingTop:10, paddingBottom:6, minHeight:60, textDecoration:'none', position:'relative', WebkitTapHighlightColor:'transparent' }}>
                {active && <div style={{ position:'absolute', top:0, width:24, height:2, background:'#8B5CF6', borderRadius:'0 0 2px 2px' }} />}
                <Icon size={20} style={{ color:active?'#A78BFA':'#4B5563' }} />
                <span style={{ fontSize:9, fontWeight:active?600:400, color:active?'#A78BFA':'#4B5563' }}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
