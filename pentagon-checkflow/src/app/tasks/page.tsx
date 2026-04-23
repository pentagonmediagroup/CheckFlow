'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { MOCK_SESSIONS, TASK_STAGES, MOCK_EMPLOYEES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { User } from 'lucide-react'

type Task = {
  id: string
  status: string
  assigned_to: string
  session: {
    id: string
    clients: { name: string }
    service: string
    studio: string
    payment_status: string
    deliverables: { type: string; quantity: number }[]
  }
}

function buildInitialTasks(): Task[] {
  return MOCK_SESSIONS.flatMap(session =>
    session.tasks.map(task => ({
      id: task.id,
      status: task.status,
      assigned_to: task.assigned_to,
      session: {
        id: session.id,
        clients: session.clients,
        service: session.service,
        studio: session.studio,
        payment_status: session.payment_status,
        deliverables: session.deliverables,
      }
    }))
  )
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Setup':              { bg: 'rgba(107,33,168,0.15)', text: '#C084FC', border: 'rgba(107,33,168,0.4)' },
  'Recording Complete': { bg: 'rgba(59,130,246,0.15)', text: '#93C5FD', border: 'rgba(59,130,246,0.4)' },
  'QC Check':           { bg: 'rgba(234,179,8,0.15)', text: '#FDE047', border: 'rgba(234,179,8,0.4)' },
  'File Naming':        { bg: 'rgba(16,185,129,0.15)', text: '#6EE7B7', border: 'rgba(16,185,129,0.4)' },
  'Upload':             { bg: 'rgba(245,158,11,0.15)', text: '#FCD34D', border: 'rgba(245,158,11,0.4)' },
  'Editing':            { bg: 'rgba(239,68,68,0.15)', text: '#FCA5A5', border: 'rgba(239,68,68,0.4)' },
  'Ready to Send':      { bg: 'rgba(139,92,246,0.15)', text: '#DDD6FE', border: 'rgba(139,92,246,0.4)' },
  'Delivered':          { bg: 'rgba(34,197,94,0.15)', text: '#86EFAC', border: 'rgba(34,197,94,0.4)' },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(buildInitialTasks())
  const [filter, setFilter] = useState<string>('all')

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const newStatus = result.destination.droppableId
    const taskId = result.draggableId

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    // Update in DB (will no-op on mock data)
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  const filteredTasks = tasks.filter(t =>
    filter === 'all' || t.assigned_to === filter
  )

  const getTasksForStage = (stage: string) => filteredTasks.filter(t => t.status === stage)

  const handleDeliveryAction = (task: Task) => {
    const isPaid = task.session.payment_status === 'Paid in Full'
    const name = task.session.clients.name
    const deliverables = task.session.deliverables.map(d => d.quantity > 1 ? `${d.quantity}x ${d.type}` : d.type).join(', ')

    if (isPaid) {
      const msg = `Yo ${name} — your files are ready. Here's your link: [LINK].\nIncludes: ${deliverables}.\n1 revision (2 days). Extra revisions: $75.`
      navigator.clipboard.writeText(msg)
      alert('Delivery message copied to clipboard!')
    } else {
      const msg = `Hey ${name} — your files are ready.\nRemaining balance required before release.`
      navigator.clipboard.writeText(msg)
      alert('Payment request message copied to clipboard!')
    }
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Task Pipeline</h1>
            <p className="text-gray-400 mt-1 text-sm">Drag & drop tasks between stages</p>
          </div>
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <option value="all">All Employees</option>
              {MOCK_EMPLOYEES.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
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
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                      {stage}
                    </span>
                    <span className="text-xs text-gray-600">{stageTasks.length}</span>
                  </div>

                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className="min-h-20 rounded-xl p-2 space-y-2 transition-colors"
                        style={{
                          background: snapshot.isDraggingOver ? colors.bg : 'rgba(26,16,48,0.5)',
                          border: `1px solid ${snapshot.isDraggingOver ? colors.border : '#2D1F4E'}`,
                          minHeight: '80px',
                        }}>
                        {stageTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                className="rounded-lg p-3 transition-all"
                                style={{
                                  background: snapshot.isDragging ? '#2D1F4E' : '#1A1030',
                                  border: `1px solid ${snapshot.isDragging ? colors.border : '#2D1F4E'}`,
                                  boxShadow: snapshot.isDragging ? `0 8px 24px rgba(0,0,0,0.4)` : 'none',
                                  ...provided.draggableProps.style,
                                }}>
                                {/* Studio badge */}
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                    style={task.session.studio === 'Studio A'
                                      ? { background: 'rgba(107,33,168,0.4)', color: '#C084FC' }
                                      : { background: 'rgba(234,179,8,0.2)', color: '#FDE047' }}>
                                    {task.session.studio === 'Studio A' ? 'A' : 'B'}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate">{task.session.service.split(' ')[0]}</span>
                                </div>

                                <Link href={`/sessions/${task.session.id}`}
                                  className="block text-sm font-medium text-white hover:text-yellow-400 transition-colors truncate">
                                  {task.session.clients.name}
                                </Link>

                                <div className="text-xs mt-1 truncate"
                                  style={{ color: task.session.payment_status === 'Paid in Full' ? '#86EFAC' : '#FCA5A5' }}>
                                  {task.session.payment_status}
                                </div>

                                {/* Deliverables */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.session.deliverables.slice(0, 2).map((d, i) => (
                                    <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                                      style={{ background: '#2D1F4E', color: '#9CA3AF' }}>
                                      {d.quantity > 1 ? `${d.quantity}x ` : ''}{d.type.split(' ')[0]}
                                    </span>
                                  ))}
                                </div>

                                {/* Action buttons for Ready to Send */}
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
                        ))}
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
