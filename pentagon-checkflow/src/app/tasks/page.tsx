'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { MOCK_SESSIONS, TASK_STAGES, MOCK_EMPLOYEES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ChevronDown, X } from 'lucide-react'

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
    (session.tasks ?? []).map(task => ({
      id: task.id,
      status: task.status,
      assigned_to: task.assigned_to,
      session: {
        id: session.id,
        clients: session.clients,
        service: session.service,
        studio: session.studio,
        payment_status: session.payment_status,
        deliverables: session.deliverables ?? [],
      },
    }))
  )
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Setup':              { bg: 'rgba(192,132,252,0.12)', text: '#C084FC', border: 'rgba(192,132,252,0.35)' },
  'Recording Complete': { bg: 'rgba(147,197,253,0.12)', text: '#93C5FD', border: 'rgba(147,197,253,0.35)' },
  'QC Check':           { bg: 'rgba(253,224,71,0.12)',  text: '#FDE047', border: 'rgba(253,224,71,0.35)' },
  'File Naming':        { bg: 'rgba(110,231,183,0.12)', text: '#6EE7B7', border: 'rgba(110,231,183,0.35)' },
  'Upload':             { bg: 'rgba(252,211,77,0.12)',  text: '#FCD34D', border: 'rgba(252,211,77,0.35)' },
  'Editing':            { bg: 'rgba(252,165,165,0.12)', text: '#FCA5A5', border: 'rgba(252,165,165,0.35)' },
  'Ready to Send':      { bg: 'rgba(221,214,254,0.12)', text: '#DDD6FE', border: 'rgba(221,214,254,0.35)' },
  'Delivered':          { bg: 'rgba(134,239,172,0.12)', text: '#86EFAC', border: 'rgba(134,239,172,0.35)' },
}

const AVATAR_COLORS = [
  'rgba(139,92,246,0.3)', 'rgba(245,158,11,0.3)',
  'rgba(6,182,212,0.3)', 'rgba(16,185,129,0.3)', 'rgba(239,68,68,0.25)',
]
const AVATAR_TEXT = ['#A78BFA', '#F59E0B', '#22D3EE', '#34D399', '#F87171']

const empInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const empById = (id: string) => MOCK_EMPLOYEES.find(e => e.id === id)

export default function TasksPage() {
  const [tasks, setTasks]   = useState<Task[]>(buildInitialTasks())
  const [filter, setFilter] = useState<string>('all')
  const [assignOpen, setAssignOpen] = useState<string | null>(null)

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const newStatus = result.destination.droppableId
    const taskId    = result.draggableId
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  const reassign = async (taskId: string, empId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: empId } : t))
    setAssignOpen(null)
    await supabase.from('tasks').update({ assigned_to: empId }).eq('id', taskId)
  }

  const filteredTasks = tasks.filter(t => filter === 'all' || t.assigned_to === filter)
  const getTasksForStage = (stage: string) => filteredTasks.filter(t => t.status === stage)

  const handleDeliveryAction = (task: Task) => {
    const isPaid = task.session.payment_status === 'Paid in Full'
    const name   = task.session.clients.name
    const items  = (task.session.deliverables ?? []).map(d => d.quantity > 1 ? `${d.quantity}x ${d.type}` : d.type).join(', ')
    const msg = isPaid
      ? `Yo ${name} — your files are ready. Here's your link: [LINK].\nIncludes: ${items}.\n1 revision (2 days). Extra revisions: $75.`
      : `Hey ${name} — your files are ready.\nRemaining balance required before release.`
    navigator.clipboard.writeText(msg)
    alert(isPaid ? 'Delivery message copied!' : 'Payment request copied!')
  }

  return (
    <AppShell>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono tracking-widest px-2 py-0.5 rounded"
                style={{ background: 'rgba(6,182,212,0.12)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.25)' }}>
                PIPELINE
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#E8ECF4', letterSpacing: '-0.02em' }}>Task Pipeline</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4B5563' }}>Drag & drop to move between stages</p>
          </div>

          {/* Filter by employee */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1 mr-1">
              {MOCK_EMPLOYEES.map((emp, i) => (
                <button key={emp.id} onClick={() => setFilter(filter === emp.id ? 'all' : emp.id)}
                  title={emp.name}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2"
                  style={{
                    background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    color: AVATAR_TEXT[i % AVATAR_TEXT.length],
                    borderColor: filter === emp.id ? '#8B5CF6' : '#080B14',
                    transform: filter === emp.id ? 'scale(1.15)' : 'scale(1)',
                  }}>
                  {empInitials(emp.name)}
                </button>
              ))}
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: '#111525', border: '1px solid #1E2340', color: '#E8ECF4' }}>
              <option value="all">All Staff</option>
              {MOCK_EMPLOYEES.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="p-1.5 rounded-lg" style={{ color: '#6B7280', background: '#111525' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {TASK_STAGES.map(stage => {
              const stageTasks = getTasksForStage(stage)
              const colors     = STAGE_COLORS[stage] ?? { bg: 'rgba(107,114,128,0.12)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' }
              return (
                <div key={stage} className="flex-shrink-0 w-56">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                      {stage}
                    </span>
                    <span className="text-xs font-mono" style={{ color: '#374151' }}>{stageTasks.length}</span>
                  </div>

                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className="rounded-xl p-2 space-y-2 transition-colors"
                        style={{
                          background: snapshot.isDraggingOver ? colors.bg : 'rgba(17,21,37,0.5)',
                          border: `1px solid ${snapshot.isDraggingOver ? colors.border : '#1E2340'}`,
                          minHeight: '80px',
                        }}>
                        {stageTasks.map((task, index) => {
                          const emp      = empById(task.assigned_to)
                          const empIdx   = MOCK_EMPLOYEES.findIndex(e => e.id === task.assigned_to)
                          const empBg    = AVATAR_COLORS[empIdx >= 0 ? empIdx % AVATAR_COLORS.length : 0]
                          const empColor = AVATAR_TEXT[empIdx >= 0 ? empIdx % AVATAR_TEXT.length : 0]

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  className="rounded-lg p-3 transition-all"
                                  style={{
                                    background: snapshot.isDragging ? '#1E2340' : '#111525',
                                    border: `1px solid ${snapshot.isDragging ? colors.border : '#1E2340'}`,
                                    boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
                                    ...provided.draggableProps.style,
                                  }}>
                                  {/* Studio + service */}
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                      style={task.session.studio === 'Studio A'
                                        ? { background: 'rgba(139,92,246,0.25)', color: '#A78BFA' }
                                        : { background: 'rgba(245,158,11,0.18)', color: '#F59E0B' }}>
                                      {task.session.studio === 'Studio A' ? 'A' : 'B'}
                                    </span>
                                    <span className="text-xs truncate" style={{ color: '#4B5563' }}>
                                      {task.session.service.split(' ')[0]}
                                    </span>
                                  </div>

                                  {/* Client name */}
                                  <Link href={`/sessions/${task.session.id}`}
                                    className="block text-sm font-semibold hover:text-yellow-400 transition-colors truncate mb-1"
                                    style={{ color: '#E8ECF4' }}>
                                    {task.session.clients.name}
                                  </Link>

                                  {/* Payment */}
                                  <div className="text-xs mb-2"
                                    style={{ color: task.session.payment_status === 'Paid in Full' ? '#86EFAC' : '#FCA5A5' }}>
                                    {task.session.payment_status}
                                  </div>

                                  {/* Deliverables */}
                                  {(task.session.deliverables ?? []).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {task.session.deliverables.slice(0, 2).map((d, i) => (
                                        <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                                          style={{ background: '#1A1F38', color: '#6B7280' }}>
                                          {d.quantity > 1 ? `${d.quantity}x ` : ''}{d.type.split(' ')[0]}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* ── Assigned employee ── */}
                                  <div className="relative">
                                    <button
                                      onClick={() => setAssignOpen(assignOpen === task.id ? null : task.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                                      style={{ background: '#0C0F1E', border: '1px solid #1A1F38' }}>
                                      {emp ? (
                                        <>
                                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{ background: empBg, color: empColor }}>
                                            {empInitials(emp.name)}
                                          </div>
                                          <span className="text-xs flex-1 text-left truncate" style={{ color: '#9CA3AF' }}>
                                            {emp.name.split(' ')[0]}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-xs flex-1 text-left" style={{ color: '#4B5563' }}>Unassigned</span>
                                      )}
                                      <ChevronDown size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                                    </button>

                                    {/* Dropdown */}
                                    {assignOpen === task.id && (
                                      <div className="absolute left-0 right-0 bottom-full mb-1 rounded-lg overflow-hidden z-20"
                                        style={{ background: '#111525', border: '1px solid #2A2F50', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                                        {MOCK_EMPLOYEES.map((emp, i) => (
                                          <button key={emp.id} onClick={() => reassign(task.id, emp.id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/5 text-left"
                                            style={{ borderBottom: i < MOCK_EMPLOYEES.length - 1 ? '1px solid #1A1F38' : 'none' }}>
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                              style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: AVATAR_TEXT[i % AVATAR_TEXT.length] }}>
                                              {empInitials(emp.name)}
                                            </div>
                                            <div>
                                              <div className="text-xs font-medium" style={{ color: '#E8ECF4' }}>{emp.name}</div>
                                              <div className="text-xs" style={{ color: '#4B5563' }}>{emp.role}</div>
                                            </div>
                                            {emp.available && (
                                              <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10B981' }} />
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Delivery button */}
                                  {stage === 'Ready to Send' && (
                                    <button onClick={() => handleDeliveryAction(task)}
                                      className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                      style={task.session.payment_status === 'Paid in Full'
                                        ? { background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }
                                        : { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
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
