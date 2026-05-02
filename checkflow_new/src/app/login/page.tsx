'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mic2, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0F0A1E' }}>
      
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6B21A8 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #EAB308 0%, transparent 70%)' }} />
        {/* Pentagon grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6B21A8" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #6B21A8, #4C1D95)', boxShadow: '0 0 40px rgba(107,33,168,0.6), 0 0 80px rgba(107,33,168,0.2)' }}>
            <Mic2 size={36} style={{ color: '#EAB308' }} />
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-wide">THE PENTAGON</h1>
          <p className="mt-1 font-display text-xl tracking-widest" style={{ color: '#EAB308' }}>CHECKFLOW</p>
          <p className="mt-2 text-sm text-gray-500">Studio Operating System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{ background: '#1A1030', border: '1px solid #2D1F4E', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <h2 className="text-lg font-semibold text-white mb-1">Welcome Back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@thepentagon.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                style={{ background: '#0F0A1E', border: '1px solid #2D1F4E' }}
                onFocus={e => e.target.style.borderColor = '#6B21A8'}
                onBlur={e => e.target.style.borderColor = '#2D1F4E'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                  style={{ background: '#0F0A1E', border: '1px solid #2D1F4E' }}
                  onFocus={e => e.target.style.borderColor = '#6B21A8'}
                  onBlur={e => e.target.style.borderColor = '#2D1F4E'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 mt-2"
              style={{
                background: loading ? '#4C1D95' : 'linear-gradient(135deg, #6B21A8, #4C1D95)',
                color: '#EAB308',
                boxShadow: loading ? 'none' : '0 0 20px rgba(107,33,168,0.4)',
              }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Access is by invitation only. Contact your admin.
        </p>
      </div>
    </div>
  )
}
