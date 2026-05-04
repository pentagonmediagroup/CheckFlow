'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react'

export default function CashflowPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: se } = await supabase.from('sessions')
        .select('id,client_name,session_type,date,payment_status,amount_owed,amount_paid,late_fee,salesperson:staff!sessions_salesperson_id_fkey(id,name)')
        .order('date', { ascending: false })

      const rows = se || []
      setSessions(rows)

      // group commissions by salesperson
      const map: Record<string, { name: string; totalSales: number; commission: number }> = {}
      rows.forEach((r: any) => {
        if (r.salesperson && r.payment_status === 'Paid in Full') {
          const id = r.salesperson.id
          if (!map[id]) map[id] = { name: r.salesperson.name, totalSales: 0, commission: 0 }
          map[id].totalSales += r.amount_paid || 0
          map[id].commission += (r.amount_paid || 0) * 0.25
        }
      })
      setCommissions(Object.values(map))
      setLoading(false)
    }
    load()
  }, [])

  const totalOwed = sessions.reduce((s, r) => s + (r.amount_owed || 0), 0)
  const totalPaid = sessions.reduce((s, r) => s + (r.amount_paid || 0), 0)
  const totalOutstanding = sessions.reduce((s, r) => s + Math.max(0, (r.amount_owed || 0) - (r.amount_paid || 0)), 0)
  const totalLateFees = sessions.reduce((s, r) => s + (r.late_fee || 0), 0)

  const PAY_COLOR: Record<string, string> = {
    'Paid in Full': '#34D399', 'Deposit Paid': '#FCD34D', 'Unpaid': '#F87171',
    'Late Fee Applied': '#FB923C', 'Cancelled': '#6B7280', 'Rescheduled': '#60A5FA', 'Refunded': '#A78BFA',
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)', display: 'inline-block', marginBottom: 4 }}>CASHFLOW</span>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8ECF4' }}>Financial Overview</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Revenue, collections & commission tracking</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Invoiced', value: `$${totalOwed.toFixed(2)}`, Icon: DollarSign, c: '#A78BFA', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.2)' },
          { label: 'Collected', value: `$${totalPaid.toFixed(2)}`, Icon: TrendingUp, c: '#34D399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Outstanding', value: `$${totalOutstanding.toFixed(2)}`, Icon: AlertCircle, c: totalOutstanding > 0 ? '#F87171' : '#34D399', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
          { label: 'Late Fees', value: `$${totalLateFees.toFixed(2)}`, Icon: DollarSign, c: '#FB923C', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' },
        ].map(({ label, value, Icon, c, bg, border }) => (
          <div key={label} style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, padding: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={15} style={{ color: c }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{loading ? '…' : value}</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Commission tracker */}
      {commissions.length > 0 && (
        <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2D1F4E', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} style={{ color: '#EAB308' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>Sales Commissions</span>
            <span style={{ fontSize: 10, color: '#6B7280' }}>25% on paid in full</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #1A1F38' }}>
              {['Salesperson','Total Sales','Commission Owed'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, color: '#4B5563', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {commissions.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1A1F38' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#34D399' }}>${c.totalSales.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#EAB308' }}>${c.commission.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sessions table */}
      <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #2D1F4E' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>All Sessions</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead><tr style={{ borderBottom: '1px solid #1A1F38' }}>
              {['Client','Type','Date','Owed','Paid','Balance','Status'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, color: '#4B5563', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sessions.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#4B5563' }}>No sessions yet</td></tr>
              )}
              {sessions.map(s => {
                const balance = (s.amount_owed || 0) - (s.amount_paid || 0) + (s.late_fee || 0)
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1A1F38' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>{s.client_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280' }}>{s.session_type}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{s.date}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#E8ECF4' }}>${(s.amount_owed || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#34D399' }}>${(s.amount_paid || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: balance > 0 ? '#F87171' : '#34D399' }}>${balance.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 500, background: `${PAY_COLOR[s.payment_status] || '#6B7280'}22`, color: PAY_COLOR[s.payment_status] || '#6B7280', border: `1px solid ${PAY_COLOR[s.payment_status] || '#6B7280'}44`, whiteSpace: 'nowrap' }}>{s.payment_status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
