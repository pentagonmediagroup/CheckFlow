'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{ minHeight: '100dvh', background: '#080B14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#EAB308', margin: '0 auto 14px' }}>P</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#E8ECF4', fontFamily: 'monospace', letterSpacing: '0.06em' }}>STUDIOFLOW</div>
          <div style={{ fontSize: 10, color: '#EAB308', letterSpacing: '0.12em', marginTop: 2 }}>THE PENTAGON</div>
          <p style={{ fontSize: 13, color: '#4B5563', marginTop: 10 }}>Sign in to your studio dashboard</p>
        </div>
        <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'owner@thepentagon.com' },
            { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>{label}</label>
              <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                onKeyDown={e => e.key === 'Enter' && router.push('/dashboard')}
                style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#E8ECF4', width: '100%', outline: 'none' }} />
            </div>
          ))}
          <button onClick={() => router.push('/dashboard')}
            style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48, background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 30px rgba(107,33,168,0.4)' }}>
            Sign In ⚡
          </button>
        </div>
      </div>
    </div>
  )
}
