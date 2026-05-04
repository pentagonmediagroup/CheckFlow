'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, ChevronDown } from 'lucide-react'

const STATUS_OPTS = ['Available','In Session','Off Duty']
const STATUS_STYLE: Record<string, any> = {
  'Available':  { bg: 'rgba(16,185,129,0.12)',  color: '#34D399', border: 'rgba(16,185,129,0.3)' },
  'In Session': { bg: 'rgba(139,92,246,0.15)',  color: '#A78BFA', border: 'rgba(139,92,246,0.3)' },
  'Off Duty':   { bg: 'rgba(75,85,99,0.2)',     color: '#6B7280', border: 'rgba(75,85,99,0.3)'   },
}

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [addingRole, setAddingRole] = useState(false)

  const [form, setForm] = useState({ name: '', role_id: '', status: 'Available', phone: '', email: '' })

  const load = async () => {
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from('staff').select('id,name,status,phone,email,sessions_count,roles(id,name)').order('name'),
      supabase.from('roles').select('id,name').order('name'),
    ])
    setStaff(s || [])
    setRoles(r || [])
  }

  useEffect(() => { load() }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const saveEmployee = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('staff').insert({
      name: form.name.trim(),
      role_id: form.role_id || null,
      status: form.status,
      phone: form.phone,
      email: form.email,
    })
    setForm({ name: '', role_id: '', status: 'Available', phone: '', email: '' })
    setSaving(false)
    setShowForm(false)
    load()
  }

  const saveRole = async () => {
    if (!newRole.trim()) return
    await supabase.from('roles').insert({ name: newRole.trim() })
    setNewRole('')
    setAddingRole(false)
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('staff').update({ status }).eq('id', id)
    setStaff(s => s.map(x => x.id === id ? { ...x, status } : x))
  }

  const deleteEmployee = async (id: string) => {
    await supabase.from('staff').delete().eq('id', id)
    setStaff(s => s.filter(x => x.id !== id))
  }

  const inputStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#E8ECF4', width: '100%', outline: 'none', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.04em' }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.08)', color: '#EAB308', border: '1px solid rgba(245,158,11,0.2)', display: 'inline-block', marginBottom: 4 }}>STAFF</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8ECF4' }}>Studio Staff</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{staff.length} team members</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setAddingRole(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Add Role
          </button>
          <button onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={14} /> New Employee
          </button>
        </div>
      </div>

      {/* Add Role modal */}
      {addingRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#0C0F1E', border: '1px solid #2D1F4E', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#E8ECF4', marginBottom: 16 }}>Add New Role</h3>
            <label style={labelStyle}>Role Name</label>
            <input style={inputStyle} placeholder="e.g. Director of Photography" value={newRole}
              onChange={e => setNewRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveRole()} autoFocus />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={saveRole} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Save Role</button>
              <button onClick={() => setAddingRole(false)} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid #2D1F4E', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
            </div>
            {/* Existing roles list */}
            {roles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>Current Roles</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {roles.map(r => (
                    <span key={r.id} style={{ padding: '3px 10px', background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, fontSize: 12 }}>{r.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New employee form */}
      {showForm && (
        <div style={{ marginBottom: 20, background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAB308' }}>New Employee</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <div className="grid-2">
            <div>
              <label style={labelStyle}>Employee Name</label>
              <input style={inputStyle} placeholder="Full name" value={form.name}
                onChange={e => set('name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEmployee()}
                autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <div style={{ position: 'relative' }}>
                <select style={inputStyle} value={form.role_id} onChange={e => set('role_id', e.target.value)}>
                  <option value="">— Select Role —</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} placeholder="404-555-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={saveEmployee} disabled={saving || !form.name.trim()}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: !form.name.trim() ? .5 : 1 }}>
              {saving ? 'Saving…' : '+ Save Employee'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid #2D1F4E', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Staff grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
        {staff.map(s => {
          const st = STATUS_STYLE[s.status] || STATUS_STYLE['Off Duty']
          return (
            <div key={s.id} style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#EAB308', flexShrink: 0 }}>
                    {s.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#E8ECF4' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{s.roles?.name || 'No role assigned'}</div>
                  </div>
                </div>
                <button onClick={() => deleteEmployee(s.id)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
              </div>
              {/* Status picker */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: st.bg, color: st.color, border: `1px solid ${st.border}`, appearance: 'none', outline: 'none' }}>
                  {STATUS_OPTS.map(opt => <option key={opt} value={opt} style={{ background: '#0F0A1E', color: '#E8ECF4' }}>{opt}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Sessions</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>{s.sessions_count || 0}</span>
              </div>
              {s.phone && <div style={{ fontSize: 11, color: '#4B5563', marginTop: 8 }}>📞 {s.phone}</div>}
              {s.email && <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>✉ {s.email}</div>}
            </div>
          )
        })}
        {staff.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#4B5563' }}>
            No staff yet — click "+ New Employee" to add one.
          </div>
        )}
      </div>
    </div>
  )
}
