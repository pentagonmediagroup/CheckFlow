'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { MOCK_SESSIONS, TASK_STAGES, MOCK_EMPLOYEES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { User, Plus, X } from 'lucide-react'

type Employee = { id: string; name: string; role: string }
type Task = {
  id: string; status: string; assigned_to: string | null
  session: {
    id: string; clients: { name: string }; service: string
    studio: string; payment_status: string; total_amount: number
    amount_paid: number; late_fee: number
    deliverables: { type: string; quantity: number }[]
  }
}

function buildInitialTasks(): Task[] {
  return MOCK_SESSIONS.flatMap(session =>
    session.tasks.map(task => ({
      id: task.id, status: task.status, assigned_to: task.assigned_to,
      session: {
        id: session.id, clients: session.clients, service: session.service,
        studio: session.studio, payment_status: session.payment_status,
        total_amount: session.total_amount, amount_paid: session.amount_paid, late_fee: session.late_fee,
        deliverables: session.deliverables,
      }
    }))
  )
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Setup':              { bg: 'rgba(107,33,168,0.15)', text: '#C084FC', border: 'rgba(107,33,168,0.4)' },
  'Recording Complete': { bg: 'rgba(59,130,246,0.15)', text: '#93C5FD', border: 'rgba(59,130,246,0.4)' },
  'QC Check':           { bg: 'rgba(234,179,8,0.15)',  text: '#FDE047', border: 'rgba(234,179,8,0.4)' },
  'File Naming':        { bg: 'rgba(16,185,129,0.15)', text: '#6EE7B7', border: 'rgba(16,185,129,0.4)' },
  'Upload':             { bg: 'rgba(245,158,11,0.15)', text: '#FCD34D', border: 'rgba(245,158,11,0.4)' },
  'Editing':            { bg: 'rgba(239,68,68,0.15)',  text: '#FCA5A5', border: 'rgba(239,68,68,0.4)' },
  'Ready to Send':      { bg: 'rgba(139,92,246,0.15)', text: '#DDD6FE', border: 'rgba(139,92,246,0.4)' },
  'Delivered':          { bg: 'rgba(34,197,94,0.15)',  text: '#86EFAC', border: 'rgba(34,197,94,0.4)' },
}

const STATUS_COLORS: Record<string, string> = {
  'Paid in Full': '#86EFAC', 'Deposit Paid': '#FDE047', 'Balance Due': '#FCA5A5',
  'Late Fee Applied': '#FDBA74', 'Rescheduled': '#93C5FD', 'Cancelled': '#9CA3AF',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(buildInitialTasks())
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)
  const [filter, setFilter] = useState<string>('all')
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskStage, setNewTaskStage] = useState('')
  const [newTaskLabel, setNewTaskLabel] = useState('')

  useEffect(() => {
    // Load real tasks from Supabase
    supabase.from('tasks')
      .select(`id, status, assigned_to, sessions(id, service, studio, payment_status, total_amount, amount_paid, late_fee, clients(id, name), deliverables(type, quantity))`)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped = data.map((t: any) => ({
            id: t.id, status: t.status, assigned_to: t.assigned_to,
            session: {
              id: t.sessions?.id, clients: t.sessions?.clients,
              service: t.sessions?.service, studio: t.sessions?.studio,
              payment_status: t.sessions?.payment_status,
              total_amount: t.sessions?.total_amount || 0,
              amount_paid: t.sessions?.amount_paid || 0,
              late_fee: t.sessions?.late_fee || 0,
              deliverables: t.sessions?.deliverables || [],
            }
          }))
          setTasks(mapped)
        }
      })
    supabase.from('employees').select('id,name,role').order('name').then(({ data }) => {
      if (data?.length) setEmployees(data)
    })
  }, [])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const newStatus = result.destination.droppableId
    const taskId = result.draggableId
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  const handleAddTask = async (stage: string) => {
    if (!newTaskLabel.trim()) return
    const { data, error } = await supabase.from('tasks').insert({ status: stage, assigned_to: null }).select().single()
    if (!error && data) {
      setTasks(prev => [...prev, {
        id: data.id, status: stage, assigned_to: null,
        session: { id: '', clients: { name: newTaskLabel }, service: 'Custom', studio: 'Studio A', payment_status: 'Balance Due', total_amount: 0, amount_paid: 0, late_fee: 0, deliverables: [] }
      }])
    }
    setShowNewTask(false)
    setNewTaskLabel('')
  }

  const handleDeliveryAction = (task: Task) => {
    const isPaid = task.session.payment_status === 'Paid in Full'
    const name = task.session.clients?.name || 'Client'
    const deliverables = task.session.deliverables?.map(d => d.quantity > 1 ? `${d.quantity}x ${d.type}` : d.type).join(', ') || ''
    const balance = (task.session.total_amount + task.session.late_fee - task.session.amount_paid).toFixed(2)
    const msg = isPaid
      ? `Yo ${name} — your files are ready. Here's your link: [LINK].\nIncludes: ${deliverables}.\n1 revision (2 days). Extra revisions: $75.`
      : `Hey ${name} — your files are ready.\nRemaining balance of $${balance} required before release.`
    navigator.clipboard.writeText(msg)
    alert(isPaid ? 'Delivery message copied!' : 'Payment request copied!')
  }

  const filteredTasks = tasks.filter(t => filter === 'all' || t.assigned_to === filter)
  const getTasksForStage = (stage: string) => filteredTasks.filter(t => t.status === stage)

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Task Pipeline</h1>
            <p className="text-gray-400 mt-1 text-sm">Drag & drop tasks between stages</p>
          </div>
          <div className="flex items-center gap-3">
            <User size={16} className="text-gray-400" />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {TASK_STAGES.map(stage => {
              const stageTasks = getTasksForStage(stage)
              const colors = STAGE_COLORS[stage]
              return (
                <div key={stage} className="flex-shrink-0 w-56">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                      {stage}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">{stageTasks.length}</span>
                      <button onClick={() => { setNewTaskStage(stage); setShowNewTask(true) }}
                        className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Inline add task */}
                  {showNewTask && newTaskStage === stage && (
                    <div className="mb-2 p-2 rounded-lg" style={{ background: '#1A1030', border: `1px solid ${colors.border}` }}>
                      <input autoFocus className="w-full px-2 py-1.5 rounded text-xs text-white outline-none mb-2"
                        style={{ background: '#0F0A1E', border: '1px solid #2D1F4E' }}
                        placeholder="Task name..."
                        value={newTaskLabel} onChange={e => setNewTaskLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddTask(stage); if (e.key === 'Escape') setShowNewTask(false) }} />
                      <div className="flex gap-1">
                        <button onClick={() => handleAddTask(stage)}
                          className="flex-1 py-1 rounded text-xs font-semibold text-black"
                          style={{ background: colors.text }}>Add</button>
                        <button onClick={() => setShowNewTask(false)}
                          className="p-1 rounded text-gray-500 hover:text-white">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className="min-h-20 rounded-xl p-2 space-y-2 transition-colors"
                        style={{
                          background: snapshot.isDraggingOver ? colors.bg : 'rgba(26,16,48,0.5)',
                          border: `1px solid ${snapshot.isDraggingOver ? colors.border : '#2D1F4E'}`,
                          minHeight: '80px',
                        }}>
                        {stageTasks.map((task, index) => {
                          const balance = task.session.total_amount + task.session.late_fee - task.session.amount_paid
                          const statusColor = STATUS_COLORS[task.session.payment_status] || '#9CA3AF'
                          const emp = employees.find(e => e.id === task.assigned_to)
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  className="rounded-lg p-3 transition-all"
                                  style={{
                                    background: snapshot.isDragging ? '#2D1F4E' : '#1A1030',
                                    border: `1px solid ${snapshot.isDragging ? colors.border : '#2D1F4E'}`,
                                    boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
                                    ...provided.draggableProps.style,
                                  }}>
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                      style={task.session.studio === 'Studio A'
                                        ? { background: 'rgba(107,33,168,0.4)', color: '#C084FC' }
                                        : { background: 'rgba(234,179,8,0.2)', color: '#FDE047' }}>
                                      {task.session.studio === 'Studio A' ? 'A' : 'B'}
                                    </span>
                                    <span className="text-xs text-gray-500 truncate">{task.session.service?.split(' ')[0]}</span>
                                  </div>

                                  {task.session.id ? (
                                    <Link href={`/sessions/${task.session.id}`}
                                      className="block text-sm font-medium text-white hover:text-yellow-400 transition-colors truncate">
                                      {task.session.clients?.name}
                                    </Link>
                                  ) : (
                                    <div className="text-sm font-medium text-white truncate">{task.session.clients?.name}</div>
                                  )}

                                  <div className="text-xs mt-1 truncate" style={{ color: statusColor }}>
                                    {task.session.payment_status}
                                  </div>

                                  {/* Balance */}
                                  {balance > 0 && (
                                    <div className="text-xs mt-0.5" style={{ color: '#FCA5A5' }}>
                                      Balance: ${balance.toFixed(2)}
                                    </div>
                                  )}

                                  {/* Assigned employee */}
                                  {emp && (
                                    <div className="text-xs mt-1 text-gray-500 truncate">👤 {emp.name}</div>
                                  )}

                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.session.deliverables?.slice(0, 2).map((d, i) => (
                                      <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                                        style={{ background: '#2D1F4E', color: '#9CA3AF' }}>
                                        {d.quantity > 1 ? `${d.quantity}x ` : ''}{d.type.split(' ')[0]}
                                      </span>
                                    ))}
                                  </div>

                                  {stage === 'Ready to Send' && (
                                    <button onClick={() => handleDeliveryAction(task)}
                                      className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                      style={task.session.payment_status === 'Paid in Full'
                                        ? { background: 'rgba(34,197,94,0.2)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.4)' }
                                        : { background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.4)' }}>
                                      {task.session.payment_status === 'Paid in Full' ? '📤 Send Delivery' : '💰 Request Payment'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>
    </AppShell>
  )
}
