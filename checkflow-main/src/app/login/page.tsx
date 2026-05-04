'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    if (email && password) router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#080B14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#F59E0B', margin: '0 auto 14px' }}>P</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.06em' }}>STUDIOFLOW</div>
          <div style={{ fontSize: 10, color: '#F59E0B', letterSpacing: '0.12em', marginTop: 2 }}>THE PENTAGON</div>
          <p style={{ fontSize: 13, color: '#4B5563', marginTop: 10 }}>Sign in to your studio dashboard</p>
        </div>
        <div style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'owner@theentagon.com' },
            { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 5, letterSpacing: '0.06em' }}>{label.toUpperCase()}</label>
              <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 8, padding: '11px 12px', fontSize: 13, color: '#E8ECF4', outline: 'none' }} />
            </div>
          ))}
          <button onClick={handleLogin} style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
