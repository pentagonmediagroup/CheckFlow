'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { MOCK_CLIENTS, MOCK_SESSIONS } from '@/lib/mockData'
import { Search, Instagram, Mail, Phone, ChevronRight } from 'lucide-react'

export default function ClientsPage() {
  const [search, setSearch] = useState('')

  const clients = MOCK_CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.ig.toLowerCase().includes(search.toLowerCase())
  )

  const getSessionCount = (clientId: string) =>
    MOCK_SESSIONS.filter(s => s.client_id === clientId).length

  const getLastSession = (clientId: string) => {
    const sessions = MOCK_SESSIONS.filter(s => s.client_id === clientId)
    if (!sessions.length) return null
    return sessions.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0]
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Clients</h1>
            <p className="text-gray-400 mt-1 text-sm">{clients.length} clients in your roster</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or Instagram..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
            style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}
          />
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => {
            const sessionCount = getSessionCount(client.id)
            const lastSession = getLastSession(client.id)

            return (
              <div key={client.id} className="rounded-xl p-5 transition-all hover:border-purple-600/50 group"
                style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg"
                      style={{ background: 'linear-gradient(135deg, #6B21A8, #4C1D95)', color: '#EAB308' }}>
                      {client.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{client.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{sessionCount} session{sessionCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-yellow-400 transition-colors mt-1" />
                </div>

                <div className="space-y-2">
                  {client.ig && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Instagram size={13} />
                      <span>{client.ig}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Mail size={13} />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Phone size={13} />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                {lastSession && (
                  <div className="mt-4 pt-4 border-t border-[#2D1F4E]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Last session</span>
                      <span className="text-xs font-medium" style={{ color: '#EAB308' }}>
                        {lastSession.studio} — {lastSession.service.split(' ')[0]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Payment</span>
                      <span className={`text-xs font-medium ${lastSession.payment_status === 'Paid in Full' ? 'text-green-400' : 'text-red-400'}`}>
                        {lastSession.payment_status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>No clients found matching &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
