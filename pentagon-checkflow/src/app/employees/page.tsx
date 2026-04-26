'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { MOCK_EMPLOYEES } from '@/lib/mockData'
import { UserCog, Plus, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-react'

type Employee = {
  id: string
  name: string
  role: string
  studio: string
  available: boolean
}

const ROLES = ['Sound Engineer', 'Producer', 'Mixing Engineer', 'Mastering Engineer', 'Vocal Engineer', 'Studio Assistant']
const STUDIOS = ['A', 'B', 'Both']

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const AVATAR_COLORS = [
  { bg: 'rgba(139,92,246,0.25)', text: '#A78BFA', border: 'rgba(139,92,246,0.4)' },
  { bg: 'rgba(245,158,11,0.2)',  text: '#F59E0B', border: 'rgba(245,158,11,0.35)' },
  { bg: 'rgba(6,182,212,0.2)',   text: '#22D3EE', border: 'rgba(6,182,212,0.35)' },
  { bg: 'rgba(16,185,129,0.2)',  text: '#34D399', border: 'rgba(16,185,129,0.35)' },
  { bg: 'rgba(239,68,68,0.18)',  text: '#F87171', border: 'rgba(239,68,68,0.35)' },
]

const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(1) % AVATAR_COLORS.length]

const emptyEmployee = (): Omit<Employee, 'id'> => ({
  name: '', role: 'Sound Engineer', studio: 'A', available: true,
})

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData]   = useState<Omit<Employee, 'id'>>(emptyEmployee())
  const [adding, setAdding]       = useState(false)
  const [newData, setNewData]     = useState<Omit<Employee, 'id'>>(emptyEmployee())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id)
    setEditData({ name: emp.name, role: emp.role, studio: emp.studio, available: emp.available })
  }

  const saveEdit = () => {
    if (!editData.name.trim()) return
    setEmployees(prev => prev.map(e => e.id === editingId ? { ...e, ...editData } : e))
    setEditingId(null)
  }

  const saveNew = () => {
    if (!newData.name.trim()) return
    const id = 'e' + Date.now()
    setEmployees(prev => [...prev, { id, ...newData }])
    setAdding(false)
    setNewData(emptyEmployee())
  }

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id))
    setDeleteConfirm(null)
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <div className="text-xs mb-1" style={{ color: '#4B5563' }}>{label}</div>
      {children}
    </div>
  )

  const inputStyle = {
    background: '#080B14', border: '1px solid #2A2F50', color: '#E8ECF4',
    borderRadius: '8px', padding: '7px 10px', fontSize: '13px', width: '100%', outline: 'none',
  } as React.CSSProperties

  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  const renderForm = (
    data: Omit<Employee, 'id'>,
    onChange: (d: Omit<Employee, 'id'>) => void,
    onSave: () => void,
    onCancel: () => void,
    label: string,
  ) => (
    <div className="rounded-xl p-5 space-y-4"
      style={{ background: '#111525', border: '1px solid #8B5CF6' }}>
      <div className="text-sm font-semibold" style={{ color: '#A78BFA' }}>{label}</div>
      <div className="grid grid-cols-2 gap-3">
        {field('Full Name',
          <input style={inputStyle} value={data.name} placeholder="Employee name"
            onChange={e => onChange({ ...data, name: e.target.value })} />
        )}
        {field('Role',
          <select style={selectStyle} value={data.role} onChange={e => onChange({ ...data, role: e.target.value })}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        {field('Studio',
          <select style={selectStyle} value={data.studio} onChange={e => onChange({ ...data, studio: e.target.value })}>
            {STUDIOS.map(s => <option key={s} value={s}>Studio {s}</option>)}
          </select>
        )}
        {field('Status',
          <select style={selectStyle} value={data.available ? 'available' : 'unavailable'}
            onChange={e => onChange({ ...data, available: e.target.value === 'available' })}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.4)' }}>
          <Check size={14} /> Save
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
          style={{ color: '#6B7280', border: '1px solid #1A1F38' }}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  )

  return (
    <AppShell>
      <div className="p-6 space-y-5" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono tracking-widest px-2 py-0.5 rounded"
                style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
                STAFF MANAGEMENT
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#E8ECF4', letterSpacing: '-0.02em' }}>Employees</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4B5563' }}>{employees.length} team members</p>
          </div>
          {!adding && (
            <button onClick={() => { setAdding(true); setNewData(emptyEmployee()) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B' }}>
              <Plus size={15} /> Add Employee
            </button>
          )}
        </div>

        {/* Add form */}
        {adding && renderForm(newData, setNewData, saveNew, () => setAdding(false), '+ New Employee')}

        {/* Employee list */}
        <div className="space-y-3">
          {employees.map(emp => {
            const ac = avatarColor(emp.id)
            const isEditing = editingId === emp.id

            if (isEditing) {
              return (
                <div key={emp.id}>
                  {renderForm(editData, setEditData, saveEdit, () => setEditingId(null), 'Edit Employee')}
                </div>
              )
            }

            return (
              <div key={emp.id} className="rounded-xl transition-colors"
                style={{ background: '#111525', border: '1px solid #1E2340' }}>
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: ac.bg, color: ac.text, border: `1px solid ${ac.border}` }}>
                    {initials(emp.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: '#E8ECF4' }}>{emp.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#4B5563' }}>{emp.role}</div>
                  </div>

                  {/* Studio badge */}
                  <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
                    style={emp.studio === 'A' || emp.studio === 'Both'
                      ? { background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }
                      : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
                    Studio {emp.studio}
                  </span>

                  {/* Availability */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={emp.available
                      ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
                      : { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: emp.available ? '#10B981' : '#EF4444' }} />
                    <span className="text-xs font-medium" style={{ color: emp.available ? '#34D399' : '#F87171' }}>
                      {emp.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(emp)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                      style={{ color: '#6B7280' }}>
                      <Pencil size={14} />
                    </button>
                    {deleteConfirm === emp.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteEmployee(emp.id)}
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 rounded text-xs" style={{ color: '#4B5563' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(emp.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                        style={{ color: '#6B7280' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
