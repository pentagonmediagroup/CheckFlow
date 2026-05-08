'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) return setError('Enter username and password')
    setLoading(true); setError('')
    const err = await login(username, password)
    if (err) { setError(err); setLoading(false) }
    else router.replace('/dashboard')
  }

  return (
    <div style={{ minHeight:'100dvh', background:'#080B14', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:80, height:80, borderRadius:16, overflow:'hidden', margin:'0 auto 14px', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src="/logo.jpg" alt="The Pentagon" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:'#E8ECF4', fontFamily:'monospace', letterSpacing:'.06em' }}>STUDIOFLOW</div>
          <div style={{ fontSize:10, color:'#EAB308', letterSpacing:'.12em', marginTop:2 }}>THE PENTAGON</div>
          <p style={{ fontSize:13, color:'#6B7280', marginTop:10 }}>Sign in to access your dashboard</p>
        </div>

        <div className="card" style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="label">Username</label>
            <input
              placeholder="pentagonadmin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleLogin()}
              autoFocus
              style={{ background:'#0F0A1E', border:'1px solid #2D1F4E', borderRadius:12, padding:'11px 14px', fontSize:14, color:'#E8ECF4', width:'100%', outline:'none' }}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleLogin()}
                style={{ background:'#0F0A1E', border:'1px solid #2D1F4E', borderRadius:12, padding:'11px 44px 11px 14px', fontSize:14, color:'#E8ECF4', width:'100%', outline:'none' }}
              />
              <button
                onClick={() => setShowPw(v => !v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#4B5563', cursor:'pointer', display:'flex', alignItems:'center', padding:0 }}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize:12, color:'#F87171', background:'rgba(239,68,68,.08)', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(239,68,68,.2)', margin:0 }}>{error}</p>
          )}

          <button onClick={handleLogin} disabled={loading} className="btn btn-primary" style={{ width:'100%', minHeight:48, fontSize:15, marginTop:4 }}>
            {loading ? 'Signing in…' : 'Sign In ⚡'}
          </button>
        </div>
      </div>
    </div>
  )
}
