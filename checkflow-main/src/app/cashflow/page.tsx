'use client'
import { CASHFLOW_MONTHS } from '@/lib/data'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

const max = Math.max(...CASHFLOW_MONTHS.map(m => m.revenue))

export default function CashflowPage() {
  const totalYTD = CASHFLOW_MONTHS.reduce((s, m) => s + m.collected, 0)
  const outstanding = CASHFLOW_MONTHS.reduce((s, m) => s + (m.revenue - m.collected), 0)
  const lastMonth = CASHFLOW_MONTHS[CASHFLOW_MONTHS.length - 2]

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)', display: 'inline-block', marginBottom: 4 }}>CASHFLOW</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>Financial Overview</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>Revenue, collections & outstanding balances</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Collected YTD',   value: `$${totalYTD.toLocaleString()}`, icon: DollarSign,   color: '#34D399',  bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.2)'  },
          { label: 'This Month',      value: `$${lastMonth.revenue}`,          icon: TrendingUp,   color: '#A78BFA',  bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.2)'  },
          { label: 'Outstanding',     value: `$${outstanding}`,                icon: AlertCircle,  color: '#F87171',  bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.2)'   },
          { label: 'Avg / Month',     value: `$${Math.round(totalYTD / 5).toLocaleString()}`, icon: TrendingDown, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, padding: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={14} style={{ color }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#E8ECF4', marginBottom: 16 }}>Monthly Revenue vs Collected</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, marginBottom: 8 }}>
          {CASHFLOW_MONTHS.map((m) => (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%', justifyContent: 'center' }}>
                <div style={{ flex: 1, height: `${Math.round((m.revenue / max) * 100)}%`, background: 'rgba(139,92,246,0.4)', borderRadius: '4px 4px 0 0', minHeight: 4 }} title={`Revenue: $${m.revenue}`} />
                <div style={{ flex: 1, height: `${Math.round((m.collected / max) * 100)}%`, background: '#10B981', borderRadius: '4px 4px 0 0', minHeight: 4 }} title={`Collected: $${m.collected}`} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {CASHFLOW_MONTHS.map((m) => (
            <div key={m.month} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#4B5563' }}>{m.month}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: 'rgba(139,92,246,0.5)', borderRadius: 2 }} /><span style={{ fontSize: 11, color: '#6B7280' }}>Revenue</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: '#10B981', borderRadius: 2 }} /><span style={{ fontSize: 11, color: '#6B7280' }}>Collected</span></div>
        </div>
      </div>

      {/* Month breakdown table */}
      <div style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #1A1F38' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>Month Breakdown</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1A1F38' }}>
              {['Month', 'Revenue', 'Collected', 'Outstanding', 'Rate'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, color: '#4B5563', fontWeight: 500, letterSpacing: '0.08em' }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CASHFLOW_MONTHS.map((m) => {
              const owed = m.revenue - m.collected
              const rate = Math.round((m.collected / m.revenue) * 100)
              return (
                <tr key={m.month} style={{ borderBottom: '1px solid #1A1F38' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#E8ECF4', fontWeight: 500 }}>{m.month}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#E8ECF4' }}>${m.revenue.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#34D399' }}>${m.collected.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: owed > 0 ? '#F87171' : '#4B5563' }}>{owed > 0 ? `$${owed}` : '—'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: '#1A1F38', borderRadius: 2 }}>
                        <div style={{ width: `${rate}%`, height: '100%', background: rate === 100 ? '#10B981' : '#8B5CF6', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#6B7280', width: 34, textAlign: 'right' }}>{rate}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
