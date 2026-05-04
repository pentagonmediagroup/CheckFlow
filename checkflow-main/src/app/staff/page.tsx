'use client'
import { STAFF } from '@/lib/data'
import { UserCog, Circle } from 'lucide-react'

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Available':   { bg: 'rgba(16,185,129,0.12)',  color: '#34D399', border: 'rgba(16,185,129,0.25)' },
  'In Session':  { bg: 'rgba(139,92,246,0.15)',  color: '#A78BFA', border: 'rgba(139,92,246,0.3)'  },
  'Off Duty':    { bg: 'rgba(75,85,99,0.2)',     color: '#6B7280', border: 'rgba(75,85,99,0.3)'    },
}

export default function StaffPage() {
  return (
    <div style={{ padding: '20px 24px', maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)', display: 'inline-block', marginBottom: 4 }}>STAFF</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>Studio Staff</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>Engineers, availability & session history</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {STAFF.map((s) => {
          const st = STATUS_STYLES[s.status] ?? STATUS_STYLES['Off Duty']
          return (
            <div key={s.id} style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#F59E0B', flexShrink: 0 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#E8ECF4' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{s.role}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 500, background: st.bg, color: st.color, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <Circle size={5} fill={st.color} style={{ color: st.color }} />
                  {s.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Sessions this month</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>{s.sessions}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
