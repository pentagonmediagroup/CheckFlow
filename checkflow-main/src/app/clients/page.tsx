'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Edit2, Check } from 'lucide-react'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const blank = { name: '', type: '', phone: '', email: '', instagram: '', salesperson_id: '', notes: '' }
  const [form, setForm] = useState(blank)

  const load = async () => {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('clients').select('*,salesperson:staff(id,name)').order('name'),
      supabase.from('staff').select('id,name,roles(name)').order('name'),
    ])
    setClients(c || [])
    setStaff(s || [])
  }

  useEffect(() => { load() }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = { name: form.name.trim(), type: form.type, phone: form.phone, email: form.email, instagram: form.instagram, salesperson_id: form.salesperson_id || null, notes: form.notes }
    if (editId) {
      await supabase.from('clients').update(payload).eq('id', editId)
    } else {
      await supabase.from('clients').insert(payload)
    }
    setForm(blank); setShowForm(false); setEditId(null); setSaving(false); load()
  }

  const startEdit = (c: any) => {
    setForm({ name: c.name, type: c.type || '', phone: c.phone || '', email: c.email || '', instagram: c.instagram || '', salesperson_id: c.salesperson_id || '', notes: c.notes || '' })
    setEditId(c.id); setShowForm(true)
  }

  const del = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id)
    setClients(c => c.filter(x => x.id !== id))
  }

  const inputStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#E8ECF4', width: '100%', outline: 'none', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.04em' }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.08)', color: '#EAB308', border: '1px solid rgba(245,158,11,0.2)', display: 'inline-block', marginBottom: 4 }}>CLIENTS</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8ECF4' }}>Client Roster</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{clients.length} clients</p>
        </div>
        <button onClick={() => { setForm(blank); setEditId(null); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> New Client
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: 20, background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAB308' }}>{editId ? 'Edit Client' : 'New Client'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <div className="grid-2">
            <div><label style={labelStyle}>Client Name *</label><input style={inputStyle} placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
            <div><label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="">— Select —</option>
                {['Artist','Band','DJ/Producer','Podcast','Corporate','Solo','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Phone</label><input style={inputStyle} placeholder="404-555-0000" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" placeholder="client@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label style={labelStyle}>Instagram</label><input style={inputStyle} placeholder="@handle" value={form.instagram} onChange={e => set('instagram', e.target.value)} /></div>
            <div>
              <label style={labelStyle}>Salesperson <span style={{ color: '#6B7280', fontSize: 10 }}>(25% commission on paid)</span></label>
              <select style={inputStyle} value={form.salesperson_id} onChange={e => set('salesperson_id', e.target.value)}>
                <option value="">— Select Salesperson —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}{s.roles?.name ? ` · ${s.roles.name}` : ''}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={save} disabled={saving || !form.name.trim()} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: !form.name.trim() ? .5 : 1 }}>
              {saving ? 'Saving…' : editId ? '✓ Update Client' : '+ Save Client'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid #2D1F4E', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2D1F4E' }}>
              {['Client','Type','Contact','Salesperson','Commission'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: '#4B5563', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1A1F38' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#EAB308', flexShrink: 0 }}>{c.name?.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>{c.name}</div>
                      {c.instagram && <div style={{ fontSize: 10, color: '#6B7280' }}>{c.instagram}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: '#6B7280' }}>{c.type || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  {c.email && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{c.email}</div>}
                  {c.phone && <div style={{ fontSize: 11, color: '#4B5563' }}>{c.phone}</div>}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: c.salesperson ? '#A78BFA' : '#4B5563' }}>
                  {c.salesperson?.name || '—'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {c.salesperson && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>25% on paid</span>}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(c)} style={{ width: 30, height: 30, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, color: '#A78BFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={13} /></button>
                    <button onClick={() => del(c.id)} style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>No clients yet — add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
