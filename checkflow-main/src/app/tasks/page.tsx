'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { MOCK_SESSIONS, TASK_STAGES, MOCK_EMPLOYEES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'

type Employee = { id: string; name: string; role: string }
type Task = {
  id: string; status: string; assigned_to: string | null
  session: { id: string; clients: { name: string }; service: string; studio: string; payment_status: string; total_amount: number; amount_paid: number; late_fee: number; deliverables: { type: string; quantity: number }[] }
}

function buildMockTasks(): Task[] {
  return MOCK_SESSIONS.flatMap(s =>
    s.tasks.map(t => ({
      id: t.id, status: t.status, assigned_to: t.assigned_to,
      session: { id: s.id, clients: s.clients, service: s.service, studio: s.studio, payment_status: s.payment_status, total_amount: s.total_amount, amount_paid: s.amount_paid, late_fee: s.late_fee, deliverables: s.deliverables }
    }))
  )
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Setup':              { bg: 'rgba(107,33,168,0.15)', text: '#C084FC', border: 'rgba(107,33,168,0.4)' },
  'Recording Complete': { bg: 'rgba(59,130,246,0.15)', text: '#93C5FD', border: 'rgba(59,130,246,0.4)' },
  'QC Check':           { bg: 'rgba(234,179,8,0.15)',  text: '#FDE047', border: 'rgba(234,179,8,0.4)'  },
  'File Naming':        { bg: 'rgba(16,185,129,0.15)', text: '#6EE7B7', border: 'rgba(16,185,129,0.4)' },
  'Upload':             { bg: 'rgba(245,158,11,0.15)', text: '#FCD34D', border: 'rgba(245,158,11,0.4)' },
  'Editing':            { bg: 'rgba(239,68,68,0.15)',  text: '#FCA5A5', border: 'rgba(239,68,68,0.4)'  },
  'Ready to Send':      { bg: 'rgba(139,92,246,0.15)', text: '#DDD6FE', border: 'rgba(139,92,246,0.4)' },
  'Delivered':          { bg: 'rgba(34,197,94,0.15)',  text: '#86EFAC', border: 'rgba(34,197,94,0.4)'  },
}

const PAY_COLORS: Record<string, string> = {
  'Paid in Full': '#86EFAC', 'Deposit Paid': '#FDE047', 'Balance Due': '#FCA5A5',
  'Late Fee Applied': '#FDBA74', 'Rescheduled': '#93C5FD', 'Unpaid': '#FCA5A5', 'Cancelled': '#9CA3AF',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(buildMockTasks())
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)
  const [filter, setFilter] = useState('all')
  const [addingStage, setAddingStage] = useState<string|null>(null)
  const [newLabel, setNewLabel] = useState('')

  useEffect(() => {
    supabase.from('tasks')
      .select('id,status,assigned_to,sessions(id,service,studio,payment_status,total_amount,amount_paid,late_fee,clients(id,name),deliverables(type,quantity))')
      .then(({ data }) => {
        if (data?.length) {
          setTasks(data.map((t: any) => ({
            id: t.id, status: t.status, assigned_to: t.assigned_to,
            session: { id: t.sessions?.id, clients: t.sessions?.clients, service: t.sessions?.service, studio: t.sessions?.studio, payment_status: t.sessions?.payment_status, total_amount: t.sessions?.total_amount||0, amount_paid: t.sessions?.amount_paid||0, late_fee: t.sessions?.late_fee||0, deliverables: t.sessions?.deliverables||[] }
          })))
        }
      })
    supabase.from('employees').select('id,name,role').order('name').then(({ data }) => { if (data?.length) setEmployees(data) })
  }, [])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const newStatus = result.destination.droppableId
    const taskId = result.draggableId
    setTasks(p => p.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  const handleAddTask = async (stage: string) => {
    if (!newLabel.trim()) return
    const { data, error } = await supabase.from('tasks').insert({ status: stage }).select().single()
    if (!error && data) {
      setTasks(p => [...p, { id: data.id, status: stage, assigned_to: null, session: { id: '', clients: { name: newLabel }, service: 'Custom Task', studio: 'Studio A', payment_status: 'Balance Due', total_amount: 0, amount_paid: 0, late_fee: 0, deliverables: [] } }])
    }
    setAddingStage(null); setNewLabel('')
  }

  const handleDeliver = (task: Task) => {
    const paid = task.session.payment_status === 'Paid in Full'
    const name = task.session.clients?.name || 'Client'
    const delivs = task.session.deliverables?.map(d => d.quantity > 1 ? `${d.quantity}x ${d.type}` : d.type).join(', ') || ''
    const bal = (task.session.total_amount + task.session.late_fee - task.session.amount_paid).toFixed(2)
    const msg = paid
      ? `Yo ${name} — your files are ready. Here's your link: [LINK].\nIncludes: ${delivs}.\n1 revision (2 days). Extra revisions: $75.`
      : `Hey ${name} — your files are ready.\nRemaining balance of $${bal} required before release.`
    navigator.clipboard.writeText(msg)
    alert(paid ? 'Delivery message copied!' : 'Payment request copied!')
  }

  const visibleTasks = tasks.filter(t => filter === 'all' || t.assigned_to === filter)
  const stageCount = (stage: string) => visibleTasks.filter(t => t.status === stage).length

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#2D1F4E', color: '#9CA3AF' }}>tasks</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }}>LIVE</span>
        </div>
        <div className="hidden md:block text-xs font-bold tracking-widest mb-1" style={{ color: '#6B7280' }}>PIPELINE</div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Task Pipeline</h1>
            <p className="text-gray-400 text-xs md:text-sm mt-0.5">Drag to move between stages</p>
          </div>
        </div>

        {/* Staff filter — avatar row like live site */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setFilter('all')}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={filter === 'all' ? { background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308' } : { background: '#1A1030', color: '#6B7280', border: '1px solid #2D1F4E' }}>
            All Staff
          </button>
          {employees.map(emp => {
            const initials = emp.name.split(' ').map(n=>n[0]).join('').slice(0,2)
            const active = filter === emp.id
            return (
              <button key={emp.id} onClick={() => setFilter(emp.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={active ? { background: 'rgba(107,33,168,0.4)', color: '#C084FC', border: '1px solid #6B21A8' } : { background: '#1A1030', color: '#6B7280', border: '1px solid #2D1F4E' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: active ? '#6B21A8' : '#2D1F4E', color: active ? '#EAB308' : '#9CA3AF' }}>
                  {initials}
                </span>
                <span className="hidden sm:inline">{emp.name.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
            {TASK_STAGES.map(stage => {
              const c = STAGE_COLORS[stage]
              const stageTasks = visibleTasks.filter(t => t.status === stage)
              return (
                <div key={stage} className="flex-shrink-0 w-44 md:w-52">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full truncate max-w-[80%]"
                      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                      {stage}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-600">{stageCount(stage)}</span>
                      <button onClick={() => { setAddingStage(stage); setNewLabel('') }}
                        className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        <Plus size={11}/>
                      </button>
                    </div>
                  </div>

                  {/* Inline add */}
                  {addingStage === stage && (
                    <div className="mb-2 p-2 rounded-lg" style={{ background: '#1A1030', border: `1px solid ${c.border}` }}>
                      <input autoFocus className="w-full px-2 py-1.5 rounded text-xs text-white outline-none mb-1.5"
                        style={{ background: '#0F0A1E', border: '1px solid #2D1F4E' }}
                        placeholder="Task name..."
                        value={newLabel} onChange={e => setNewLabel(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') handleAddTask(stage); if (e.key==='Escape') setAddingStage(null) }} />
                      <div className="flex gap-1">
                        <button onClick={() => handleAddTask(stage)} className="flex-1 py-1 rounded text-[10px] font-bold text-black" style={{ background: c.text }}>Add</button>
                        <button onClick={() => setAddingStage(null)} className="p-1 text-gray-500 hover:text-white rounded"><X size={11}/></button>
                      </div>
                    </div>
                  )}

                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className="space-y-2 rounded-xl p-1.5 md:p-2 min-h-[80px] transition-colors"
                        style={{ background: snapshot.isDraggingOver ? c.bg : 'rgba(26,16,48,0.4)', border: `1px solid ${snapshot.isDraggingOver ? c.border : '#2D1F4E'}` }}>
                        {stageTasks.map((task, index) => {
                          const emp = employees.find(e => e.id === task.assigned_to)
                          const initials = emp ? emp.name.split(' ').map(n=>n[0]).join('').slice(0,2) : null
                          const payColor = PAY_COLORS[task.session.payment_status] || '#9CA3AF'
                          const balance = task.session.total_amount + task.session.late_fee - task.session.amount_paid
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  className="rounded-lg p-2 md:p-3 transition-all"
                                  style={{ background: snapshot.isDragging ? '#2D1F4E' : '#1A1030', border: `1px solid ${snapshot.isDragging ? c.border : '#2D1F4E'}`, boxShadow: snapshot.isDragging ? '0 8px 20px rgba(0,0,0,0.5)' : 'none', ...provided.draggableProps.style }}>

                                  {/* Studio badge + service */}
                                  <div className="flex items-center gap-1 mb-1.5">
                                    <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold"
                                      style={task.session.studio === 'Studio A'
                                        ? { background: 'rgba(107,33,168,0.4)', color: '#C084FC' }
                                        : { background: 'rgba(234,179,8,0.2)', color: '#FDE047' }}>
                                      {task.session.studio === 'Studio A' ? 'A' : 'B'}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] text-gray-500 truncate">{task.session.service?.split(' ')[0]}</span>
                                  </div>

                                  {/* Client name */}
                                  {task.session.id ? (
                                    <Link href={`/sessions/${task.session.id}`}
                                      className="block text-xs md:text-sm font-semibold text-white hover:text-yellow-400 truncate transition-colors">
                                      {task.session.clients?.name}
                                    </Link>
                                  ) : (
                                    <div className="text-xs md:text-sm font-semibold text-white truncate">{task.session.clients?.name}</div>
                                  )}

                                  {/* Payment status */}
                                  <div className="text-[9px] md:text-[10px] mt-0.5 truncate" style={{ color: payColor }}>
                                    {task.session.payment_status}
                                  </div>

                                  {/* Balance */}
                                  {balance > 0 && (
                                    <div className="text-[9px] md:text-[10px]" style={{ color: '#FCA5A5' }}>
                                      Balance: ${balance.toFixed(2)}
                                    </div>
                                  )}

                                  {/* Deliverables */}
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {task.session.deliverables?.slice(0,2).map((d,i) => (
                                      <span key={i} className="text-[8px] md:text-[9px] px-1 py-0.5 rounded"
                                        style={{ background: '#2D1F4E', color: '#9CA3AF' }}>
                                        {d.quantity > 1 ? `${d.quantity}x ` : ''}{d.type.split(' ')[0]}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Assigned employee */}
                                  {initials && (
                                    <div className="flex items-center gap-1 mt-1.5">
                                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                                        style={{ background: '#2D1F4E', color: '#EAB308' }}>{initials}</span>
                                      <span className="text-[9px] text-gray-500 truncate">{emp?.name.split(' ')[0]}</span>
                                    </div>
                                  )}

                                  {/* Ready to Send action */}
                                  {stage === 'Ready to Send' && (
                                    <button onClick={() => handleDeliver(task)}
                                      className="w-full mt-2 py-1.5 rounded text-[10px] md:text-xs font-semibold transition-all"
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
