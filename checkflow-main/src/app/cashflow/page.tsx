'use client'

import { useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { MOCK_SESSIONS, SERVICE_PRICING } from '@/lib/mockData'
import { isToday, isThisWeek, isThisMonth } from 'date-fns'
import { TrendingUp, DollarSign, Calendar, BarChart3, Lock } from 'lucide-react'

type BarData = { label: string; value: number; maxValue: number }

function Bar({ label, value, maxValue }: BarData) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-gray-400 truncate text-right">{label}</div>
      <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: '#0F0A1E' }}>
        <div className="h-full rounded-lg flex items-center px-2 transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6B21A8, #EAB308)', minWidth: pct > 0 ? '4px' : '0' }}>
          {pct > 15 && <span className="text-xs font-semibold text-white">${value}</span>}
        </div>
      </div>
      <div className="w-14 text-xs text-right font-semibold text-white">${value}</div>
    </div>
  )
}

export default function CashflowPage() {
  const { isOwner, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isOwner) router.push('/dashboard')
  }, [isOwner, loading, router])

  if (loading) return null
  if (!isOwner) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Lock size={48} className="mx-auto mb-4 text-gray-600" />
            <h2 className="font-display text-xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-gray-400 text-sm">Cashflow data is only available to owners.</p>
          </div>
        </div>
      </AppShell>
    )
  }

  const calcRevenue = (filter: (d: Date) => boolean) =>
    MOCK_SESSIONS.filter(s => filter(new Date(s.start_time)))
      .reduce((acc, s) => {
        const price = SERVICE_PRICING[s.service] || 0
        if (s.payment_status === 'Paid in Full') return acc + price
        if (s.payment_status === 'Deposit Paid') return acc + price * 0.5
        return acc
      }, 0)

  const daily = calcRevenue(isToday)
  const weekly = calcRevenue((d) => isThisWeek(d))
  const monthly = calcRevenue((d) => isThisMonth(d))
  const total = MOCK_SESSIONS.reduce((acc, s) => acc + (SERVICE_PRICING[s.service] || 0), 0)

  // Revenue by service
  const byService: Record<string, number> = {}
  MOCK_SESSIONS.forEach(s => {
    byService[s.service] = (byService[s.service] || 0) + (SERVICE_PRICING[s.service] || 0)
  })
  const maxService = Math.max(...Object.values(byService))

  const stats = [
    { label: "Today's Revenue", value: `$${daily}`, icon: Calendar, color: '#EAB308' },
    { label: 'This Week', value: `$${weekly}`, icon: TrendingUp, color: '#C084FC' },
    { label: 'This Month', value: `$${monthly}`, icon: BarChart3, color: '#93C5FD' },
    { label: 'Total (Est.)', value: `$${total}`, icon: DollarSign, color: '#86EFAC' },
  ]

  return (
    <AppShell>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">Cashflow Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Revenue overview — Owner only</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-5"
              style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${color}22` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div className="font-display text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Revenue by Service */}
        <div className="rounded-xl p-6 mb-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
          <h2 className="font-display text-lg font-semibold text-white mb-6">Revenue by Service</h2>
          <div className="space-y-4">
            {Object.entries(byService)
              .sort(([, a], [, b]) => b - a)
              .map(([service, amount]) => (
                <Bar key={service} label={service} value={amount} maxValue={maxService} />
              ))}
          </div>
        </div>

        {/* Session Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
          <div className="px-6 py-4 border-b border-[#2D1F4E]">
            <h2 className="font-display text-lg font-semibold text-white">Sessions ({MOCK_SESSIONS.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2D1F4E' }}>
                  {['Client', 'Studio', 'Service', 'Payment Status', 'Amount'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_SESSIONS.map(s => (
                  <tr key={s.id} className="border-b border-[#2D1F4E] hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{s.clients.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={s.studio === 'Studio A'
                          ? { background: 'rgba(107,33,168,0.3)', color: '#C084FC' }
                          : { background: 'rgba(234,179,8,0.2)', color: '#FDE047' }}>
                        {s.studio}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{s.service}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${s.payment_status === 'Paid in Full' ? 'text-green-400' : s.payment_status === 'Deposit Paid' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#EAB308' }}>
                      ${SERVICE_PRICING[s.service] || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
