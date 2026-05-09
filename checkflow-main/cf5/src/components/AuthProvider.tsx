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

  const login = async (username: string, password: string): Promise<string|null> => {
    // Check app_users table
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username.trim())
      .eq('password_hash', password)
      .eq('is_active', true)
      .single()
    if (data) {
      const u: User = { id: data.id, username: data.username, role: data.role, employee_id: data.employee_id }
      setUser(u)
      localStorage.setItem('cf_user', JSON.stringify(u))
      return null
    }
    // Also check employees table
    const { data: emp } = await supabase
      .from('employees')
      .select('id,name,username,password_hash,app_role')
      .eq('username', username.trim())
      .eq('password_hash', password)
      .single()
    if (emp) {
      const u: User = { id: emp.id, username: emp.username, role: emp.app_role || 'employee', employee_id: emp.id }
      setUser(u)
      localStorage.setItem('cf_user', JSON.stringify(u))
      return null
    }
    return 'Invalid username or password'
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cf_user')
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}
