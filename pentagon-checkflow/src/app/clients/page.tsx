'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { MOCK_CLIENTS } from '@/lib/mockData'
import { Users, Search, Pencil, X, Check, Plus, Mail, Phone, Instagram, Calendar, DollarSign } from 'lucide-react'

type Client = {
  id: string; name: string; email: string; phone: string; ig: string
  total_sessions: number; total_spend: number; last_visit: string
}

const AVATAR_COLORS = [
  { bg: 'rgba(139,92,246,0.25)', text: '#A78BFA' },
  { bg: 'rgba(245,158,11,0.2)',  text: '#F59E0B' },
  { bg: 'rgba(6,182,212,0.2)',   text: '#22D3EE' },
  { bg: 'rgba(16,185,129,0.2)',  text: '#34D399' },
]
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(1) % AVATAR_COLORS.length]
const initials    = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

// IMPORTANT: fontSize 16px on all inputs prevents iOS auto-zoom
const inputStyle: React.CSSProperties = {
  background: '#080B14', border: '1px solid #2A2F50', color: '#E8ECF4',
  borderRadius: '8px', padding: '10px 12px', fontSize: '16px', width: '100%',
  outline: 'none', WebkitAppearance: 'none',
}

const emptyClient = (): Omit<Client, 'id'> => ({
  name: '', email: '', phone: '', ig: '',
  total_sessions: 0, total_spend: 0,
  last_visit: new Date().toISOString().slice(0, 10),
})

export default function ClientsPage() {
  const [clients, setClients]     = useState<Client[]>(MOCK_CLIENTS)
  const [search, setSearch]       = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData]   = useState<Partial<Client>>({})
  const [adding, setAdding]       = useState(false)
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>(emptyClient())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (c: Client) => { setEditingId(c.id); setEditData({ ...c }) }

  const saveEdit = () => {
    if (!editData.name?.trim()) return
    setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...editData } as Client : c))
    setEditingId(null)
  }

  const saveNew = () => {
    if (!newClient.name.trim()) return
    setClients(prev => [...prev, { id: 'c' + Date.now(), ...newClient }])
    setAdding(false)
    setNewClient(emptyClient())
  }

  const deleteClient = (id: string) => { setClients(prev => prev.filter(c => c.id !== id)); setDeleteConfirm(null) }

  // ── Shared edit form ──────────────────────────────────────
  const EditForm = ({
    data, onChange, onSave, onCancel,
  }: { data: Partial<Client>; onChange: (d: Partial<Client>) => void; onSave: () => void; onCancel: () => void }) => (
    <div className="px-4 py-4 space-y-3" style={{ background: '#0C0F1E' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { key: 'name',    label: 'Full Name',    type: 'text',   icon: <span style={{fontSize:11}}>✎</span>,   placeholder: 'Client name' },
          { key: 'email',   label: 'Email',        type: 'email',  icon: <Mail size={11} />,      placeholder: 'email@example.com' },
          { key: 'phone',   label: 'Phone',        type: 'tel',    icon: <Phone size={11} />,     placeholder: '555-0000' },
          { key: 'ig',      label: 'Instagram',    type: 'text',   icon: <Instagram size={11} />, placeholder: '@handle' },
          { key: 'total_spend', label: 'Total Spend ($)', type: 'number', icon: <DollarSign size={11} />, placeholder: '0' },
          { key: 'last_visit',  label: 'Last Visit', type: 'date',  icon: <Calendar size={11} />,  placeholder: '' },
        ].map(({ key, label, type, icon, placeholder }) => (
          <div key={key}>
            <div className="flex items-center gap-1 mb-1.5" style={{ color: '#4B5563' }}>
              {icon}
              <span className="text-xs">{label}</span>
            </div>
            <input
              style={inputStyle}
              type={type}
              value={(data as Record<string, string | number>)[key] ?? ''}
              placeholder={placeholder}
              onChange={e => onChange({ ...data, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave}
          className="flex items-center gap-2 px-4 rounded-lg text-sm font-semibold"
          style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.4)', minHeight: '44px' }}>
          <Check size={14} /> Save
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-4 rounded-lg text-sm"
          style={{ color: '#6B7280', border: '1px solid #1A1F38', minHeight: '44px' }}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  )

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-5 space-y-4" style={{ maxWidth: '1000px' }}>

        {/* Header */}
        <div className="flex items-start justify-between pt-1">
          <div>
            <span className="text-xs font-mono tracking-widest px-2 py-0.5 rounded inline-block mb-1"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
              CLIENT ROSTER
            </span>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#E8ECF4', letterSpacing: '-0.02em' }}>Clients</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4B5563' }}>{clients.length} total clients</p>
          </div>
          <button onClick={() => setAdding(!adding)}
            className="flex items-center gap-2 px-3 md:px-4 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', minHeight: '44px' }}>
            <Plus size={15} /> <span className="hidden sm:inline">Add Client</span><span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Search — font-size 16px prevents iOS zoom */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4B5563' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{ ...inputStyle, paddingLeft: '36px', paddingRight: '16px' }}
          />
        </div>

        {/* Add form */}
        {adding && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #8B5CF6' }}>
            <div className="px-4 py-3" style={{ background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.3)' }}>
              <span className="text-sm font-semibold" style={{ color: '#A78BFA' }}>New Client</span>
            </div>
            <EditForm data={newClient} onChange={d => setNewClient(d as Omit<Client,'id'>)} onSave={saveNew} onCancel={() => setAdding(false)} />
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { label: 'Sessions', value: clients.reduce((a, c) => a + c.total_sessions, 0), icon: Calendar, color: '#8B5CF6' },
            { label: 'Revenue',  value: `$${clients.reduce((a, c) => a + c.total_spend, 0).toLocaleString()}`, icon: DollarSign, color: '#F59E0B' },
            { label: 'Clients',  value: clients.length, icon: Users, color: '#10B981' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl px-3 py-3 flex items-center gap-2 md:gap-3"
              style={{ background: '#111525', border: '1px solid #1E2340' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <div>
                <div className="text-sm md:text-base font-bold" style={{ color: '#E8ECF4' }}>{value}</div>
                <div className="text-xs" style={{ color: '#4B5563' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MOBILE: Card list ── */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm" style={{ color: '#4B5563' }}>No clients found</div>
          )}
          {filtered.map(client => {
            const ac = avatarColor(client.id)
            const isEditing = editingId === client.id
            return (
              <div key={client.id} className="rounded-xl overflow-hidden"
                style={{ background: '#111525', border: isEditing ? '1px solid #8B5CF6' : '1px solid #1E2340' }}>
                {/* Card header row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: ac.bg, color: ac.text }}>
                    {initials(client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: '#E8ECF4' }}>{client.name}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#4B5563' }}>
                      <Mail size={10} />{client.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => isEditing ? setEditingId(null) : startEdit(client)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ color: isEditing ? '#A78BFA' : '#6B7280', background: '#0C0F1E' }}>
                      {isEditing ? <X size={14} /> : <Pencil size={14} />}
                    </button>
                  </div>
                </div>

                {/* Card detail rows */}
                {!isEditing && (
                  <div className="px-4 pb-4 grid grid-cols-2 gap-y-2 gap-x-4"
                    style={{ borderTop: '1px solid #1A1F38', paddingTop: '12px' }}>
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} style={{ color: '#4B5563' }} />
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Instagram size={11} style={{ color: '#4B5563' }} />
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{client.ig}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} style={{ color: '#4B5563' }} />
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>
                        {new Date(client.last_visit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                        {client.total_sessions} sessions
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>${client.total_spend.toLocaleString()}</span>
                    </div>
                    {/* Delete */}
                    {deleteConfirm === client.id ? (
                      <div className="col-span-2 flex items-center gap-2 pt-1">
                        <button onClick={() => deleteClient(client.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          Delete Client
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5" style={{ color: '#4B5563' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(client.id)}
                        className="col-span-2 text-xs pt-1 text-left"
                        style={{ color: '#374151' }}>Delete</button>
                    )}
                  </div>
                )}

                {/* Inline edit form */}
                {isEditing && <EditForm data={editData} onChange={setEditData} onSave={saveEdit} onCancel={() => setEditingId(null)} />}
              </div>
            )
          })}
        </div>

        {/* ── DESKTOP: Table ── */}
        <div className="hidden md:block rounded-xl overflow-hidden" style={{ border: '1px solid #1E2340' }}>
          {/* Header */}
          <div className="grid items-center px-5 py-2.5"
            style={{ gridTemplateColumns: '2.5fr 2fr 1.4fr 1.4fr 0.8fr 1fr 1fr auto', background: '#0C0F1E', borderBottom: '1px solid #1A1F38' }}>
            {['Client','Email','Phone','Instagram','Sessions','Spend','Last Visit',''].map(h => (
              <div key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: '#4B5563', background: '#111525' }}>No clients found</div>
          )}

          {filtered.map((client, idx) => {
            const ac = avatarColor(client.id)
            const isEditing = editingId === client.id
            return (
              <div key={client.id} style={{ background: idx % 2 === 0 ? '#111525' : '#0E1220', borderBottom: '1px solid #1A1F38' }}>
                <div className="grid items-center px-5 py-3.5 group"
                  style={{ gridTemplateColumns: '2.5fr 2fr 1.4fr 1.4fr 0.8fr 1fr 1fr auto' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: ac.bg, color: ac.text }}>{initials(client.name)}</div>
                    <span className="text-sm font-semibold truncate" style={{ color: '#E8ECF4' }}>{client.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 pr-3">
                    <Mail size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                    <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Instagram size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{client.ig}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#A78BFA' }}>{client.total_sessions}</span>
                  <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>${client.total_spend.toLocaleString()}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>
                    {new Date(client.last_visit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => isEditing ? setEditingId(null) : startEdit(client)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
                      style={{ color: isEditing ? '#A78BFA' : '#6B7280' }}>
                      {isEditing ? <X size={13} /> : <Pencil size={13} />}
                    </button>
                    {deleteConfirm === client.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteClient(client.id)}
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}>Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs px-1" style={{ color: '#4B5563' }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(client.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10"
                        style={{ color: '#4B5563' }}>✕</button>
                    )}
                  </div>
                </div>
                {isEditing && <EditForm data={editData} onChange={setEditData} onSave={saveEdit} onCancel={() => setEditingId(null)} />}
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}
