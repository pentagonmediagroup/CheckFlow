'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { MOCK_CLIENTS, MOCK_EMPLOYEES } from '@/lib/mockData'
import { Search, Instagram, Mail, Phone, Edit2, Save, X, DollarSign } from 'lucide-react'

type Client = { id: string; name: string; email: string; phone: string; ig: string; total_sessions: number; total_spend: number; last_visit: string | null; salesperson_id: string | null; notes: string | null }
type Employee = { id: string; name: string; role: string }

const inp = "w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
const inpStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E' }

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

  const totalSessions = clients.reduce((a, c) => a + c.total_sessions, 0)
  const totalRevenue = clients.reduce((a, c) => a + (c.total_spend || 0), 0)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.ig || '').toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (c: Client) => { setEditId(c.id); setEditForm({ name: c.name, email: c.email, phone: c.phone, ig: c.ig, salesperson_id: c.salesperson_id, notes: c.notes }) }

  const handleSave = async () => {
    if (!editId) return; setSaving(true)
    const { error } = await supabase.from('clients').update(editForm).eq('id', editId)
    if (!error) setClients(p => p.map(c => c.id === editId ? { ...c, ...editForm } : c))
    setEditId(null); setSaving(false)
  }

  const getSP = (id: string | null) => employees.find(e => e.id === id)

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#2D1F4E', color: '#9CA3AF' }}>clients</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }}>LIVE</span>
        </div>
        <div className="hidden md:block text-xs font-bold tracking-widest mb-1" style={{ color: '#6B7280' }}>CLIENT ROSTER</div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Clients</h1>
            <p className="text-gray-400 text-sm mt-0.5">{clients.length} total clients</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Sessions', value: totalSessions },
            { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}` },
            { label: 'Clients', value: clients.length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3 md:p-4 text-center" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <div className="font-display text-xl md:text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
            style={{ background: '#1A1030', border: '1px solid #2D1F4E' }} />
        </div>

        {/* Mobile: card list */}
        <div className="md:hidden space-y-3">
          {filtered.map(client => {
            const sp = getSP(client.salesperson_id)
            const isEditing = editId === client.id
            return (
              <div key={client.id} className="rounded-xl p-4" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold"
                      style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
                      {client.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{client.name}</div>
                      <div className="text-xs text-gray-500">{client.total_sessions} sessions · ${(client.total_spend||0).toLocaleString()}</div>
                    </div>
                  </div>
                  {isEditing
                    ? <div className="flex gap-1">
                        <button onClick={handleSave} disabled={saving} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg"><Save size={13}/></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-gray-500 hover:text-white rounded-lg"><X size={13}/></button>
                      </div>
                    : <button onClick={() => startEdit(client)} className="p-1.5 text-gray-500 hover:text-white rounded-lg"><Edit2 size={13}/></button>
                  }
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <input className={inp} style={inpStyle} placeholder="Instagram" value={editForm.ig||''} onChange={e => setEditForm(p=>({...p,ig:e.target.value}))} />
                    <input className={inp} style={inpStyle} placeholder="Email" value={editForm.email||''} onChange={e => setEditForm(p=>({...p,email:e.target.value}))} />
                    <input className={inp} style={inpStyle} placeholder="Phone" value={editForm.phone||''} onChange={e => setEditForm(p=>({...p,phone:e.target.value}))} />
                    <select className={`${inp} w-full`} style={{ ...inpStyle, appearance:'none' }}
                      value={editForm.salesperson_id||''} onChange={e => setEditForm(p=>({...p,salesperson_id:e.target.value||null}))}>
                      <option value="">— No salesperson —</option>
                      {employees.map(e=><option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs text-gray-500">
                    {client.ig && <div className="flex items-center gap-1.5"><Instagram size={11}/>{client.ig}</div>}
                    {client.email && <div className="flex items-center gap-1.5"><Mail size={11}/><span className="truncate">{client.email}</span></div>}
                    {client.phone && <div className="flex items-center gap-1.5"><Phone size={11}/>{client.phone}</div>}
                    {sp && <div className="flex items-center gap-1.5 pt-1 border-t border-[#2D1F4E]"><DollarSign size={11}/><span className="text-purple-300">{sp.name}</span><span className="ml-auto text-green-400">${(client.total_spend*0.25).toFixed(2)} commission</span></div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block rounded-xl overflow-hidden" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2D1F4E' }}>
                {['Client','Email','Phone','Instagram','Sessions','Spend','Salesperson','Last Visit'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => {
                const sp = getSP(client.salesperson_id)
                const isEditing = editId === client.id
                return (
                  <tr key={client.id} className="border-b border-[#2D1F4E] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
                          {client.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{client.email}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{client.phone}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{client.ig}</td>
                    <td className="px-4 py-3 text-xs text-white">{client.total_sessions}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#EAB308' }}>${(client.total_spend||0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select className="px-2 py-1 rounded text-xs text-white outline-none" style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', appearance: 'none' }}
                          value={editForm.salesperson_id||''} onChange={e => setEditForm(p=>({...p,salesperson_id:e.target.value||null}))}>
                          <option value="">— None —</option>
                          {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                      ) : (
                        <div>
                          {sp ? <div className="text-xs text-purple-300">{sp.name}</div> : <span className="text-xs text-gray-600">—</span>}
                          {sp && client.total_spend > 0 && <div className="text-xs text-green-400">${(client.total_spend*0.25).toFixed(2)}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{client.last_visit ? new Date(client.last_visit).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'}) : '—'}</td>
                    <td className="px-4 py-3">
                      {isEditing
                        ? <div className="flex gap-1">
                            <button onClick={handleSave} disabled={saving} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Save size={13}/></button>
                            <button onClick={() => setEditId(null)} className="p-1 text-gray-500 hover:text-white rounded"><X size={13}/></button>
                          </div>
                        : <button onClick={() => startEdit(client)} className="p-1 text-gray-500 hover:text-white rounded transition-colors"><Edit2 size={13}/></button>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">No clients found.</div>
        )}
      </div>
    </AppShell>
  )
}
