'use client'
import { CLIENTS } from '@/lib/data'

export default function ClientsPage() {
  return (
    <div style={{ padding: '20px 24px', maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)', display: 'inline-block', marginBottom: 4 }}>CLIENTS</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>Client Roster</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>All studio clients & account status</p>
      </div>

      <div style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1A1F38' }}>
              {['Client', 'Type', 'Sessions', 'Balance', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: '#4B5563', fontWeight: 500, letterSpacing: '0.08em' }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1A1F38' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#F59E0B', flexShrink: 0 }}>{c.name.charAt(0)}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: '#6B7280' }}>{c.type}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#E8ECF4' }}>{c.sessions}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: c.balance === '$0' ? '#4B5563' : '#F87171', fontWeight: c.balance !== '$0' ? 600 : 400 }}>{c.balance}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 500, background: c.status === 'Unpaid' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.12)', color: c.status === 'Unpaid' ? '#F87171' : '#34D399', border: c.status === 'Unpaid' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(16,185,129,0.25)' }}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
