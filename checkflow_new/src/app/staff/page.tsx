'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { EMPLOYEE_ROLES, type EmployeeRole } from '@/lib/mockData'
import { Plus, Trash2, UserCircle, Save, X } from 'lucide-react'

type Employee = {
  id: string
  name: string
  role: EmployeeRole
  email: string
  phone: string
  studio: string
  available: boolean
}

const inputClass = "w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all"
const inputStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E' }

const ROLE_COLORS: Record<string, string> = {
  'Sales': '#EAB308', 'Director': '#C084FC', 'Creative Director': '#A78BFA',
  'Editor': '#93C5FD', 'Camera Man': '#6EE7B7', 'Lighting': '#FCD34D',
  'Executive Asst.': '#F9A8D4', 'Marketing': '#FCA5A5', 'Social Media': '#FDBA74',
  'Intern': '#9CA3AF', 'Sound Engineer': '#86EFAC', 'Producer': '#C084FC',
  'Mixing Engineer': '#93C5FD', 'Mastering Engineer': '#A5F3FC',
}

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const emptyForm = { name: '', role: 'Editor' as EmployeeRole, email: '', phone: '', studio: 'Both', available: true }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('employees').select('*').order('name')
    if (!error && data) setEmployees(data)
    setLoading(false)
  }

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editId) {
        const { error } = await supabase.from('employees').update(form).eq('id', editId)
        if (!error) setEmployees(prev => prev.map(e => e.id === editId ? { ...e, ...form } : e))
      } else {
        const { data, error } = await supabase.from('employees').insert(form).select().single()
        if (!error && data) setEmployees(prev => [...prev, data])
      }
      setShowForm(false)
      setEditId(null)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (emp: Employee) => {
    setForm({ name: emp.name, role: emp.role, email: emp.email || '', phone: emp.phone || '', studio: emp.studio || 'Both', available: emp.available })
    setEditId(emp.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this employee?')) return
    await supabase.from('employees').delete().eq('id', id)
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  return (
    <AppShell>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Staff</h1>
            <p className="text-gray-400 mt-1 text-sm">{employees.length} team members</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
            <Plus size={16} /> New Employee
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="rounded-xl p-6 mb-6" style={{ background: '#1A1030', border: '1px solid #6B21A8' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">
                {editId ? 'Edit Employee' : '+ New Employee'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null) }}>
                <X size={18} className="text-gray-500 hover:text-white" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Employee Name *</label>
                <input
                  className={inputClass} style={inputStyle}
                  placeholder="Type full name..."
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Role *</label>
                <select className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.role} onChange={e => set('role', e.target.value as EmployeeRole)}>
                  {EMPLOYEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                <input className={inputClass} style={inputStyle} placeholder="email@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
                <input className={inputClass} style={inputStyle} placeholder="404-555-0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Studio Assignment</label>
                <select className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.studio} onChange={e => set('studio', e.target.value)}>
                  {['Studio A', 'Studio B', 'Both', 'N/A'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)}
                    className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-gray-300">Available</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' }}>
                <Save size={15} /> {saving ? 'Saving...' : 'Save Employee'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid #2D1F4E' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Employee Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading staff...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <UserCircle size={48} className="mx-auto mb-3 opacity-30" />
            <p>No employees yet. Add your first team member.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {employees.map(emp => {
              const roleColor = ROLE_COLORS[emp.role] || '#9CA3AF'
              return (
                <div key={emp.id} className="rounded-xl p-5 group transition-all hover:border-purple-600/50"
                  style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg"
                        style={{ background: `${roleColor}22`, color: roleColor }}>
                        {emp.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{emp.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block"
                          style={{ background: `${roleColor}22`, color: roleColor }}>
                          {emp.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(emp)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                        <Save size={13} />
                      </button>
                      <button onClick={() => handleDelete(emp.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    {emp.email && <p>{emp.email}</p>}
                    {emp.phone && <p>{emp.phone}</p>}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#2D1F4E]">
                      <span>{emp.studio || 'N/A'}</span>
                      <span className={emp.available ? 'text-green-400' : 'text-red-400'}>
                        {emp.available ? '● Available' : '● Unavailable'}
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
