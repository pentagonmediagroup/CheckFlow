'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:60,height:60,background:'linear-gradient(135deg,#6D28D9,#8B5CF6)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,color:'#EAB308',margin:'0 auto 14px' }}>SF</div>
          <div style={{ fontSize:16,fontWeight:700,color:'#E8ECF4',fontFamily:'monospace',letterSpacing:'.06em' }}>STUDIOFLOW</div>
          <div style={{ fontSize:10,color:'#EAB308',letterSpacing:'.12em',marginTop:2 }}>THE PENTAGON</div>
          <p style={{ fontSize:13,color:'#6B7280',marginTop:10 }}>Sign in to access your studio dashboard</p>
        </div>
        <div className="card" style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="label">Username</label>
            <input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()} autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()} />
          </div>
          {error && <p style={{ fontSize:12,color:'#F87171',background:'rgba(239,68,68,.08)',padding:'8px 12px',borderRadius:8,border:'1px solid rgba(239,68,68,.2)' }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} className="btn btn-primary" style={{ width:'100%', minHeight:48, fontSize:15 }}>
            {loading ? 'Signing in…' : 'Sign In ⚡'}
          </button>
        </div>
        <p style={{ textAlign:'center',fontSize:11,color:'#374151',marginTop:16 }}>StudioFlow · Powered by The Pentagon</p>
      </div>
    </div>
  )
}
