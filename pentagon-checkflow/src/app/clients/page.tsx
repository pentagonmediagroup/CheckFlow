'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { MOCK_CLIENTS } from '@/lib/mockData'
import {
  Users, Search, Pencil, X, Check, Plus,
  Mail, Phone, Instagram, Calendar, DollarSign, Hash,
} from 'lucide-react'

type Client = {
  id: string
  name: string
  email: string
  phone: string
  ig: string
  total_sessions: number
  total_spend: number
  last_visit: string
}

const AVATAR_COLORS = [
  { bg: 'rgba(139,92,246,0.25)', text: '#A78BFA' },
  { bg: 'rgba(245,158,11,0.2)',  text: '#F59E0B' },
  { bg: 'rgba(6,182,212,0.2)',   text: '#22D3EE' },
  { bg: 'rgba(16,185,129,0.2)',  text: '#34D399' },
]
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(1) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const inputStyle: React.CSSProperties = {
  background: '#080B14', border: '1px solid #2A2F50', color: '#E8ECF4',
  borderRadius: '8px', padding: '6px 10px', fontSize: '13px', width: '100%', outline: 'none',
}

export default function ClientsPage() {
  const [clients, setClients]   = useState<Client[]>(MOCK_CLIENTS)
  const [search, setSearch]     = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData]   = useState<Partial<Client>>({})
  const [adding, setAdding]       = useState(false)
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: '', email: '', phone: '', ig: '',
    total_sessions: 0, total_spend: 0, last_visit: new Date().toISOString().slice(0, 10),
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (client: Client) => {
    setEditingId(client.id)
    setEditData({ ...client })
  }

  const saveEdit = () => {
    if (!editData.name?.trim()) return
    setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...editData } as Client : c))
    setEditingId(null)
  }

  const saveNew = () => {
    if (!newClient.name.trim()) return
    const id = 'c' + Date.now()
    setClients(prev => [...prev, { id, ...newClient }])
    setAdding(false)
    setNewClient({ name: '', email: '', phone: '', ig: '', total_sessions: 0, total_spend: 0, last_visit: new Date().toISOString().slice(0, 10) })
  }

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
  }

  // ── Edit form (inline row) ────────────────────────────────────────
  const EditForm = ({ data, onChange, onSave, onCancel }: {
    data: Partial<Client>
    onChange: (d: Partial<Client>) => void
    onSave: () => void
    onCancel: () => void
  }) => (
    <div className="px-5 py-4 space-y-3" style={{ background: '#0C0F1E', borderTop: '1px solid #2A2F50' }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: '#4B5563' }}>
            <Hash size={10} /> Name
          </div>
          <input style={inputStyle} value={data.name ?? ''} placeholder="Full name"
            onChange={e => onChange({ ...data, name: e.target.value })} />
        </div>
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: '#4B5563' }}>
            <Mail size={10} /> Email
          </div>
          <input style={inputStyle} value={data.email ?? ''} placeholder="email@example.com"
            onChange={e => onChange({ ...data, email: e.target.value })} />
        </div>
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: '#4B5563' }}>
            <Phone size={10} /> Phone
          </div>
          <input style={inputStyle} value={data.phone ?? ''} placeholder="555-0000"
            onChange={e => onChange({ ...data, phone: e.target.value })} />
        </div>
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: '#4B5563' }}>
            <Instagram size={10} /> Instagram
          </div>
          <input style={inputStyle} value={data.ig ?? ''} placeholder="@handle"
            onChange={e => onChange({ ...data, ig: e.target.value })} />
        </div>
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: '#4B5563' }}>
            <DollarSign size={10} /> Total Spend ($)
          </div>
          <input style={inputStyle} type="number" value={data.total_spend ?? 0}
            onChange={e => onChange({ ...data, total_spend: Number(e.target.value) })} />
        </div>
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: '#4B5563' }}>
            <Calendar size={10} /> Last Visit
          </div>
          <input style={inputStyle} type="date" value={data.last_visit ?? ''}
            onChange={e => onChange({ ...data, last_visit: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold"
          style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.4)' }}>
          <Check size={13} /> Save
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm"
          style={{ color: '#6B7280', border: '1px solid #1A1F38' }}>
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  )

  return (
    <AppShell>
      <div className="p-6 space-y-5" style={{ maxWidth: '1000px' }}>
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono tracking-widest px-2 py-0.5 rounded"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
                CLIENT ROSTER
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#E8ECF4', letterSpacing: '-0.02em' }}>Clients</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4B5563' }}>{clients.length} total clients</p>
          </div>
          <button onClick={() => setAdding(!adding)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B' }}>
            <Plus size={15} /> Add Client
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4B5563' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#111525', border: '1px solid #1E2340', color: '#E8ECF4' }}
          />
        </div>

        {/* Add client form */}
        {adding && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #8B5CF6' }}>
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.3)' }}>
              <span className="text-sm font-semibold" style={{ color: '#A78BFA' }}>New Client</span>
            </div>
            <EditForm
              data={newClient}
              onChange={d => setNewClient(d as Omit<Client, 'id'>)}
              onSave={saveNew}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Sessions', value: clients.reduce((a, c) => a + c.total_sessions, 0), icon: Calendar, color: '#8B5CF6' },
            { label: 'Total Revenue', value: `$${clients.reduce((a, c) => a + c.total_spend, 0).toLocaleString()}`, icon: DollarSign, color: '#F59E0B' },
            { label: 'Active Clients', value: clients.length, icon: Users, color: '#10B981' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: '#111525', border: '1px solid #1E2340' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: '#E8ECF4' }}>{value}</div>
                <div className="text-xs" style={{ color: '#4B5563' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Client list — line by line */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E2340' }}>
          {/* Table header */}
          <div className="grid items-center px-5 py-2.5"
            style={{
              gridTemplateColumns: '2.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr auto',
              background: '#0C0F1E', borderBottom: '1px solid #1A1F38',
            }}>
            {['Client', 'Email', 'Phone', 'Instagram', 'Sessions', 'Spend', 'Last Visit', ''].map(h => (
              <div key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: '#4B5563', background: '#111525' }}>
              No clients found
            </div>
          )}

          {filtered.map((client, idx) => {
            const ac = avatarColor(client.id)
            const isEditing = editingId === client.id

            return (
              <div key={client.id} style={{ background: idx % 2 === 0 ? '#111525' : '#0E1220', borderBottom: '1px solid #1A1F38' }}>
                {/* Main row */}
                <div className="grid items-center px-5 py-3.5 group"
                  style={{ gridTemplateColumns: '2.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr auto' }}>

                  {/* Name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: ac.bg, color: ac.text }}>
                      {initials(client.name)}
                    </div>
                    <span className="text-sm font-semibold truncate" style={{ color: '#E8ECF4' }}>{client.name}</span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-1.5 min-w-0 pr-3">
                    <Mail size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                    <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>{client.email}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{client.phone}</span>
                  </div>

                  {/* Instagram */}
                  <div className="flex items-center gap-1.5">
                    <Instagram size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{client.ig}</span>
                  </div>

                  {/* Sessions */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold" style={{ color: '#A78BFA' }}>{client.total_sessions}</span>
                  </div>

                  {/* Spend */}
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
                      ${client.total_spend.toLocaleString()}
                    </span>
                  </div>

                  {/* Last visit */}
                  <div>
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {new Date(client.last_visit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => isEditing ? setEditingId(null) : startEdit(client)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                      style={{ color: isEditing ? '#A78BFA' : '#6B7280' }}>
                      {isEditing ? <X size={13} /> : <Pencil size={13} />}
                    </button>
                    {deleteConfirm === client.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteClient(client.id)}
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}>
                          Delete
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs" style={{ color: '#4B5563' }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(client.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                        style={{ color: '#4B5563' }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <EditForm
                    data={editData}
                    onChange={setEditData}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
