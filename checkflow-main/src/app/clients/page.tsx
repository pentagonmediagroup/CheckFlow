'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { MOCK_CLIENTS, MOCK_EMPLOYEES } from '@/lib/mockData'
import { Search, Instagram, Mail, Phone, Edit2, Save, X, DollarSign } from 'lucide-react'

type Client = {
  id: string; name: string; email: string; phone: string; ig: string
  total_sessions: number; total_spend: number; last_visit: string | null
  salesperson_id: string | null; notes: string | null
}
type Employee = { id: string; name: string; role: string }

const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
const inputStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E' }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS as Client[])
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => { if (data?.length) setClients(data) })
    supabase.from('employees').select('id,name,role').order('name').then(({ data }) => { if (data?.length) setEmployees(data) })
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.ig || '').toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (client: Client) => {
    setEditId(client.id)
    setEditForm({ name: client.name, email: client.email, phone: client.phone, ig: client.ig, salesperson_id: client.salesperson_id, notes: client.notes })
  }

  const handleSave = async () => {
    if (!editId) return
    setSaving(true)
    const { error } = await supabase.from('clients').update(editForm).eq('id', editId)
    if (!error) setClients(prev => prev.map(c => c.id === editId ? { ...c, ...editForm } : c))
    setEditId(null)
    setSaving(false)
  }

  const getSalesperson = (id: string | null) => {
    if (!id) return null
    return employees.find(e => e.id === id)
  }

  const commission = (spend: number) => (spend * 0.25).toFixed(2)

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Clients</h1>
            <p className="text-gray-400 mt-1 text-sm">{filtered.length} clients in your roster</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or Instagram..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
            style={{ background: '#1A1030', border: '1px solid #2D1F4E' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => {
            const sp = getSalesperson(client.salesperson_id)
            const isEditing = editId === client.id

            return (
              <div key={client.id} className="rounded-xl p-5 transition-all hover:border-purple-600/50"
                style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg"
                      style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
                      {client.name[0]}
                    </div>
                    <div>
                      {isEditing ? (
                        <input className="px-2 py-1 rounded text-sm text-white outline-none w-36"
                          style={inputStyle} value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                      ) : (
                        <h3 className="font-semibold text-white">{client.name}</h3>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">{client.total_sessions} session{client.total_sessions !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={handleSave} disabled={saving}
                          className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors">
                          <Save size={14} />
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(client)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {isEditing ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Instagram size={13} className="text-gray-500 flex-shrink-0" />
                        <input className={inputClass} style={inputStyle} placeholder="@handle"
                          value={editForm.ig || ''} onChange={e => setEditForm(p => ({ ...p, ig: e.target.value }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-gray-500 flex-shrink-0" />
                        <input className={inputClass} style={inputStyle} placeholder="email"
                          value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-500 flex-shrink-0" />
                        <input className={inputClass} style={inputStyle} placeholder="phone"
                          value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Salesperson</label>
                        <select className={`${inputClass} w-full`} style={{ ...inputStyle, appearance: 'none' }}
                          value={editForm.salesperson_id || ''} onChange={e => setEditForm(p => ({ ...p, salesperson_id: e.target.value || null }))}>
                          <option value="">— None —</option>
                          {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                        </select>
                      </div>
                      <textarea className={`${inputClass} resize-none`} style={inputStyle} rows={2} placeholder="Notes"
                        value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                    </>
                  ) : (
                    <>
                      {client.ig && <div className="flex items-center gap-2 text-xs text-gray-400"><Instagram size={13} /><span>{client.ig}</span></div>}
                      {client.email && <div className="flex items-center gap-2 text-xs text-gray-400"><Mail size={13} /><span className="truncate">{client.email}</span></div>}
                      {client.phone && <div className="flex items-center gap-2 text-xs text-gray-400"><Phone size={13} /><span>{client.phone}</span></div>}
                    </>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#2D1F4E] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Total Spend</span>
                    <span className="font-semibold" style={{ color: '#EAB308' }}>${client.total_spend?.toLocaleString()}</span>
                  </div>
                  {sp && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-1"><DollarSign size={11} /> Salesperson</span>
                      <span className="text-purple-300">{sp.name}</span>
                    </div>
                  )}
                  {sp && client.total_spend > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Commission (25%)</span>
                      <span className="text-green-400 font-semibold">${commission(client.total_spend)}</span>
                    </div>
                  )}
                  {client.last_visit && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Last Visit</span>
                      <span className="text-gray-400">{client.last_visit}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>No clients found matching &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
