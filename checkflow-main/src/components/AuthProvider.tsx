'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface User { id: string; username: string; role: 'owner'|'employee'; employee_id?: string }
interface AuthCtx { user: User|null; loading: boolean; login: (u:string,p:string)=>Promise<string|null>; logout: ()=>void }

const Ctx = createContext<AuthCtx>({ user:null, loading:true, login:async()=>null, logout:()=>{} })
export const useAuth = () => useContext(Ctx)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cf_user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    setLoading(false)
  }, [])

  // Heartbeat — update last_seen every 5 minutes while logged in
  useEffect(() => {
    if (!user) return
    const ping = async () => {
      await supabase.from('app_users').update({ last_seen: new Date().toISOString() }).eq('username', user.username)
    }
    ping()
    const interval = setInterval(ping, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  const login = async (username: string, password: string): Promise<string|null> => {
    // Check app_users table first
    const { data } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('password_hash', password)
      .eq('is_active', true)
      .single()

    if (data) {
      // Update last_seen immediately on login
      await supabase.from('app_users').update({ last_seen: new Date().toISOString() }).eq('id', data.id)
      const u: User = { id: data.id, username: data.username, role: data.role, employee_id: data.employee_id }
      setUser(u)
      localStorage.setItem('cf_user', JSON.stringify(u))
      return null
    }

    // Also check employees table directly
    const { data: emp } = await supabase
      .from('employees')
      .select('id,name,username,password_hash,app_role')
      .eq('username', username.trim().toLowerCase())
      .eq('password_hash', password)
      .single()

    if (emp) {
      // Upsert app_users and set last_seen
      await supabase.from('app_users').upsert({
        username: emp.username,
        password_hash: emp.password_hash,
        role: emp.app_role || 'employee',
        employee_id: emp.id,
        is_active: true,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'username' })

      const u: User = { id: emp.id, username: emp.username, role: emp.app_role || 'employee', employee_id: emp.id }
      setUser(u)
      localStorage.setItem('cf_user', JSON.stringify(u))
      return null
    }

    return 'Invalid username or password'
  }

  const logout = async () => {
    // Clear last_seen on logout so they show offline immediately
    if (user) {
      await supabase.from('app_users').update({ last_seen: null }).eq('username', user.username)
    }
    setUser(null)
    localStorage.removeItem('cf_user')
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}
