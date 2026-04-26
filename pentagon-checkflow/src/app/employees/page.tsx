'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { MOCK_EMPLOYEES } from '@/lib/mockData'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

type Employee = { id: string; name: string; role: string; studio: string; available: boolean }

const ROLES   = ['Sound Engineer','Producer','Mixing Engineer','Mastering Engineer','Vocal Engineer','Studio Assistant']
const STUDIOS = ['A','B','Both']

const AVATAR_COLORS = [
  { bg: 'rgba(139,92,246,0.25)', text: '#A78BFA', border: 'rgba(139,92,246,0.4)' },
  { bg: 'rgba(245,158,11,0.2)',  text: '#F59E0B',  border: 'rgba(245,158,11,0.35)' },
  { bg: 'rgba(6,182,212,0.2)',   text: '#22D3EE',  border: 'rgba(6,182,212,0.35)' },
  { bg: 'rgba(16,185,129,0.2)',  text: '#34D399',  border: 'rgba(16,185,129,0.35)' },
  { bg: 'rgba(239,68,68,0.18)',  text: '#F87171',  border: 'rgba(239,68,68,0.35)' },
]
const avatarColor  = (id: string) => AVATAR_COLORS[id.charCodeAt(1) % AVATAR_COLORS.length]
const empInitials  = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const emptyEmployee = (): Omit<Employee, 'id'> => ({ name: '', role: 'Sound Engineer', studio: 'A', available: true })

// fontSize 16px prevents iOS auto-zoom on input focus
const inputStyle: React.CSSProperties = {
  background: '#080B14', border: '1px solid #2A2F50', color: '#E8ECF4',
  borderRadius: '8px', padding: '10px 12px', fontSize: '16px', width: '100%',
  outline: 'none', WebkitAppearance: 'none',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

export default function EmployeesPage() {
  const [employees, setEmployees]         = useState<Employee[]>(MOCK_EMPLOYEES)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [editData, setEditData]           = useState<Omit<Employee,'id'>>(emptyEmployee())
  const [adding, setAdding]               = useState(false)
  const [newData, setNewData]             = useState<Omit<Employee,'id'>>(emptyEmployee())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const startEdit = (emp: Employee) => { setEditingId(emp.id); setEditData({ name: emp.name, role: emp.role, studio: emp.studio, available: emp.available }) }
  const saveEdit  = () => { if (!editData.name.trim()) return; setEmployees(prev => prev.map(e => e.id === editingId ? { ...e, ...editData } : e)); setEditingId(null) }
  const saveNew   = () => { if (!newData.name.trim()) return; setEmployees(prev => [...prev, { id: 'e' + Date.now(), ...newData }]); setAdding(false); setNewData(emptyEmployee()) }
  const deleteEmp = (id: string) => { setEmployees(prev => prev.filter(e => e.id !== id)); setDeleteConfirm(null) }

  const EmployeeForm = ({
    data, onChange, onSave, onCancel, title,
  }: { data: Omit<Employee,'id'>; onChange: (d: Omit<Employee,'id'>) => void; onSave: () => void; onCancel: () => void; title: string }) => (
    <div className="rounded-xl p-4 space-y-3" style={{ background: '#111525', border: '1px solid #8B5CF6' }}>
      <div className="text-sm font-semibold" style={{ color: '#A78BFA' }}>{title}</div>
      {/* Single column on mobile, 2 columns on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs mb-1.5" style={{ color: '#4B5563' }}>Full Name</div>
          <input style={inputStyle} value={data.name} placeholder="Employee name"
            onChange={e => onChange({ ...data, name: e.target.value })} />
        </div>
        <div>
          <div className="text-xs mb-1.5" style={{ color: '#4B5563' }}>Role</div>
          <select style={selectStyle} value={data.role} onChange={e => onChange({ ...data, role: e.target.value })}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs mb-1.5" style={{ color: '#4B5563' }}>Studio</div>
          <select style={selectStyle} value={data.studio} onChange={e => onChange({ ...data, studio: e.target.value })}>
            {STUDIOS.map(s => <option key={s} value={s}>Studio {s}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs mb-1.5" style={{ color: '#4B5563' }}>Availability</div>
          <select style={selectStyle} value={data.available ? 'available' : 'unavailable'}
            onChange={e => onChange({ ...data, available: e.target.value === 'available' })}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
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
      <div className="px-4 md:px-6 py-5 space-y-4" style={{ maxWidth: '900px' }}>

        {/* Header */}
        <div className="flex items-start justify-between pt-1">
          <div>
            <span className="text-xs font-mono tracking-widest px-2 py-0.5 rounded inline-block mb-1"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
              STAFF MANAGEMENT
            </span>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#E8ECF4', letterSpacing: '-0.02em' }}>Employees</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4B5563' }}>{employees.length} team members</p>
          </div>
          {!adding && (
            <button onClick={() => { setAdding(true); setNewData(emptyEmployee()) }}
              className="flex items-center gap-2 px-3 md:px-4 rounded-lg text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', minHeight: '44px' }}>
              <Plus size={15} /> <span className="hidden sm:inline">Add Employee</span><span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {/* Add form */}
        {adding && <EmployeeForm data={newData} onChange={setNewData} onSave={saveNew} onCancel={() => setAdding(false)} title="+ New Employee" />}

        {/* Employee rows */}
        <div className="space-y-2">
          {employees.map(emp => {
            const ac = avatarColor(emp.id)
            const isEditing = editingId === emp.id

            if (isEditing) {
              return <EmployeeForm key={emp.id} data={editData} onChange={setEditData} onSave={saveEdit} onCancel={() => setEditingId(null)} title="Edit Employee" />
            }

            return (
              <div key={emp.id} className="rounded-xl" style={{ background: '#111525', border: '1px solid #1E2340' }}>
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: ac.bg, color: ac.text, border: `1px solid ${ac.border}` }}>
                    {empInitials(emp.name)}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: '#E8ECF4' }}>{emp.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#4B5563' }}>{emp.role}</div>
                  </div>

                  {/* Studio — hidden on very small screens, shown as part of details below */}
                  <span className="hidden sm:inline text-xs px-2.5 py-1 rounded-lg font-bold"
                    style={emp.studio === 'A' || emp.studio === 'Both'
                      ? { background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }
                      : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
                    Studio {emp.studio}
                  </span>

                  {/* Availability dot + label */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={emp.available
                      ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
                      : { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ background: emp.available ? '#10B981' : '#EF4444' }} />
                    <span className="hidden sm:inline text-xs font-medium"
                      style={{ color: emp.available ? '#34D399' : '#F87171' }}>
                      {emp.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* Action buttons — 44px touch targets */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => startEdit(emp)}
                      className="flex items-center justify-center rounded-lg"
                      style={{ width: '40px', height: '40px', color: '#6B7280' }}>
                      <Pencil size={15} />
                    </button>
                    {deleteConfirm === emp.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteEmp(emp.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', minHeight: '36px' }}>
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-2.5 py-1.5 rounded-lg text-xs"
                          style={{ color: '#4B5563', minHeight: '36px' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(emp.id)}
                        className="flex items-center justify-center rounded-lg"
                        style={{ width: '40px', height: '40px', color: '#6B7280' }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile detail strip — studio shown here on xs */}
                <div className="sm:hidden flex items-center gap-3 px-4 pb-3">
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold"
                    style={emp.studio === 'A' || emp.studio === 'Both'
                      ? { background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }
                      : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                    Studio {emp.studio}
                  </span>
                  <span className="text-xs font-medium" style={{ color: emp.available ? '#34D399' : '#F87171' }}>
                    {emp.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}
