'use client'
import React, { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthCtx { user: { role: string } | null; signOut: () => void }
const Ctx = createContext<AuthCtx>({ user: { role: 'owner' }, signOut: () => {} })
export const useAuth = () => useContext(Ctx)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState({ role: 'owner' })
  const router = useRouter()
  const signOut = () => router.push('/login')
  return <Ctx.Provider value={{ user, signOut }}>{children}</Ctx.Provider>
}
