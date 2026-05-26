'use client'
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

interface User { id: string; username: string; role: 'owner'|'employee'|'contractor'; employee_id?: string }
interface AuthCtx { user: User|null; loading: boolean; login:(u:string,p:string)=>Promise<string|null>; logout:()=>void }
const Ctx = createContext<AuthCtx>({ user:null, loading:true, login:async()=>null, logout:()=>{} })
export const useAuth = () => useContext(Ctx)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User|null>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => {
    try { const s = localStorage.getItem('cf_user'); if (s) setUser(JSON.parse(s)) } catch {}
    setLoading(false)
  }, [])

  // Heartbeat
  useEffect(() => {
    if (!user) return
    const ping = async () => { await supabase.from('app_users').update({ last_seen:new Date().toISOString() }).eq('username', user.username) }
    ping()
    const iv = setInterval(ping, 5*60*1000)
    return () => clearInterval(iv)
  }, [user])

  // Auto sign-out timer for non-owners
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  useEffect(() => {
    if (!user || user.role === 'owner') return
    let timeoutMs = 0
    // Fetch auto_signout_seconds from settings
    supabase.from('studio_settings').select('value').eq('key','auto_signout_seconds').single().then(({ data }) => {
      timeoutMs = parseInt(data?.value || '0') * 1000
      if (!timeoutMs) return
      const startTimer = () => {
        resetTimer()
        timerRef.current = setTimeout(async () => {
          await doLogout()
        }, timeoutMs)
      }
      startTimer()
      const events = ['mousedown','keydown','touchstart','scroll']
      events.forEach(e => window.addEventListener(e, startTimer))
      return () => { events.forEach(e => window.removeEventListener(e, startTimer)); resetTimer() }
    })
  }, [user])

  const doLogout = async () => {
    if (user) {
      await supabase.from('app_users').update({ last_seen:null }).eq('username', user.username)
      await logAudit({ actor_username:user.username, actor_role:user.role, action:'LOGOUT', category:'auth', detail:'Signed out' })
    }
    setUser(null); localStorage.removeItem('cf_user')
  }

  const login = async (username: string, password: string): Promise<string|null> => {
    const uname = username.trim().toLowerCase()
    const { data } = await supabase.from('app_users').select('*').eq('username',uname).eq('password_hash',password).eq('is_active',true).single()
    if (data) {
      await supabase.from('app_users').update({ last_seen:new Date().toISOString() }).eq('id',data.id)
      const u: User = { id:data.id, username:data.username, role:data.role, employee_id:data.employee_id }
      setUser(u); localStorage.setItem('cf_user',JSON.stringify(u))
      await logAudit({ actor_username:u.username, actor_role:u.role, action:'LOGIN', category:'auth', detail:`${u.role} signed in` })
      return null
    }
    const { data: emp } = await supabase.from('employees').select('id,name,username,password_hash,app_role').eq('username',uname).eq('password_hash',password).single()
    if (emp) {
      await supabase.from('app_users').upsert({ username:emp.username, password_hash:emp.password_hash, role:emp.app_role||'employee', employee_id:emp.id, is_active:true, last_seen:new Date().toISOString() },{ onConflict:'username' })
      const u: User = { id:emp.id, username:emp.username, role:emp.app_role||'employee', employee_id:emp.id }
      setUser(u); localStorage.setItem('cf_user',JSON.stringify(u))
      await logAudit({ actor_username:u.username, actor_role:u.role, action:'LOGIN', category:'auth', detail:`${u.role} signed in` })
      return null
    }
    await logAudit({ actor_username:uname, actor_role:'unknown', action:'LOGIN_FAILED', category:'auth', detail:'Invalid credentials' })
    return 'Invalid username or password'
  }

  const logout = () => doLogout()

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}
