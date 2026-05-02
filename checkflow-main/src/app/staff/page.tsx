'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { EMPLOYEE_ROLES, type EmployeeRole } from '@/lib/mockData'
import { Plus, Trash2, Save, X, UserCog } from 'lucide-react'

type Employee = {
  id: string; name: string; role: EmployeeRole
  email: string; phone: string; studio: string; available: boolean
}

const ROLE_COLORS: Record<string, string> = {
  'Sales': '#EAB308', 'Director': '#C084FC', 'Creative Director': '#A78BFA',
  'Editor': '#93C5FD', 'Camera Man': '#6EE7B7', 'Lighting': '#FCD34D',
  'Executive Asst.': '#F9A8D4', 'Marketing': '#FCA5A5', 'Social Media': '#FDBA74',
  'Intern': '#9CA3AF', 'Sound Engineer': '#86EFAC', 'Producer': '#C084FC',
  'Mixing Engineer': '#93C5FD', 'Mastering Engineer': '#A5F3FC',
}

const inp = "w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
const inpStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E' }

const emptyForm = { name: '', role: 'Editor' as EmployeeRole, email: '', phone: '', studio: 'Both', available: true }

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('employees').select('*').order('name').then(({ data }) => {
      if (data) setEmployees(data)
      setLoading(false)
    })
  }, [])

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const openNew = () => { setForm(emptyForm); setEditId(null); setShowForm(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (editId) {
      const { error } = await supabase.from('employees').update(form).eq('id', editId)
      if (!error) setEmployees(p => p.map(e => e.id === editId ? { ...e, ...form } : e))
    } else {
      const { data, error } = await supabase.from('employees').insert(form).select().single()
      if (!error && data) setEmployees(p => [...p, data])
    }
    setShowForm(false); setEditId(null); setForm(emptyForm); setSaving(false)
  }

  const startEdit = (emp: Employee) => {
    setForm({ name: emp.name, role: emp.role, email: emp.email || '', phone: emp.phone || '', studio: emp.studio || 'Both', available: emp.available })
    setEditId(emp.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this employee?')) return
    await supabase.from('employees').delete().eq('id', id)
    setEmployees(p => p.filter(e => e.id !== id))
  }

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Page header — matches live site pattern */}
        <div className="hidden md:flex items-center gap-2 mb-1">
          <span className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ background: '#2D1F4E', color: '#9CA3AF' }}>staff</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }}>LIVE</span>
        </div>
        <div className="hidden md:block text-xs font-bold tracking-widest mb-1" style={{ color: '#6B7280' }}>STAFF MANAGEMENT</div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Employees</h1>
            <p className="text-gray-400 mt-0.5 text-sm">{employees.length} team members</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
            <Plus size={15} /> <span className="hidden sm:inline">Add Employee</span><span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-xl p-4 md:p-6 mb-6" style={{ background: '#1A1030', border: '1px solid #6B21A8' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base md:text-lg font-semibold text-white">
                {editId ? 'Edit Employee' : '+ New Employee'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null) }}>
                <X size={16} className="text-gray-500 hover:text-white" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Employee Name *</label>
                <input className={inp} style={inpStyle} placeholder="Full name..."
                  value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Role *</label>
                <select className={inp} style={{ ...inpStyle, appearance: 'none' }}
                  value={form.role} onChange={e => set('role', e.target.value as EmployeeRole)}>
                  {EMPLOYEE_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                <input type="email" className={inp} style={inpStyle} placeholder="email@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Phone</label>
                <input className={inp} style={inpStyle} placeholder="404-555-0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Studio Assignment</label>
                <select className={inp} style={{ ...inpStyle, appearance: 'none' }}
                  value={form.studio} onChange={e => set('studio', e.target.value)}>
                  {['Studio A','Studio B','Both','N/A'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.available}
                    onChange={e => set('available', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-gray-300">Available</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Employee'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid #2D1F4E' }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500 text-sm">Loading staff...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <UserCog size={44} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No employees yet. Add your first team member.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {employees.map(emp => {
              const rc = ROLE_COLORS[emp.role] || '#9CA3AF'
              return (
                <div key={emp.id} className="rounded-xl p-4 md:p-5 group transition-all"
                  style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-base flex-shrink-0"
                        style={{ background: `${rc}22`, color: rc }}>
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{emp.name}</div>
                        <span className="text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                          style={{ background: `${rc}22`, color: rc }}>{emp.role}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => startEdit(emp)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                        <Save size={12} />
                      </button>
                      <button onClick={() => handleDelete(emp.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    {emp.email && <p className="truncate">{emp.email}</p>}
                    {emp.phone && <p>{emp.phone}</p>}
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#2D1F4E]">
                      <span>{emp.studio || 'N/A'}</span>
                      <span style={{ color: emp.available ? '#86EFAC' : '#FCA5A5' }}>
                        ● {emp.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
