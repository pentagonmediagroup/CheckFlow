'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0A1E' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 animate-pulse"
            style={{ background: 'linear-gradient(135deg, #6B21A8, #EAB308)' }} />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen" style={{ background: '#0F0A1E' }}>
        {children}
      </main>
    </div>
  )
}
