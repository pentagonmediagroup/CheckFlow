'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { MOCK_SESSIONS, TASK_STAGES, MOCK_EMPLOYEES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ChevronDown, X, Filter } from 'lucide-react'

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

const AVATAR_COLORS = ['rgba(139,92,246,0.3)','rgba(245,158,11,0.3)','rgba(6,182,212,0.3)','rgba(16,185,129,0.3)','rgba(239,68,68,0.25)']
const AVATAR_TEXT   = ['#A78BFA','#F59E0B','#22D3EE','#34D399','#F87171']
const empInitials   = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const empById       = (id: string) => MOCK_EMPLOYEES.find(e => e.id === id)

export default function TasksPage() {
  const [tasks, setTasks]       = useState<Task[]>(buildInitialTasks())
  const [filter, setFilter]     = useState<string>('all')
  const [assignOpen, setAssignOpen] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)

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

  const filteredTasks    = tasks.filter(t => filter === 'all' || t.assigned_to === filter)
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
      <div className="px-4 md:px-6 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className="text-xs font-mono tracking-widest px-2 py-0.5 rounded inline-block mb-1"
              style={{ background: 'rgba(6,182,212,0.12)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.25)' }}>
              PIPELINE
            </span>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#E8ECF4', letterSpacing: '-0.02em' }}>Task Pipeline</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4B5563' }}>Drag to move between stages</p>
          </div>
          {/* Filter toggle — mobile shows button, desktop shows inline */}
          <button onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm md:hidden"
            style={{ background: filter !== 'all' ? 'rgba(139,92,246,0.2)' : '#111525', border: '1px solid #1E2340', color: filter !== 'all' ? '#A78BFA' : '#6B7280', minHeight: '44px' }}>
            <Filter size={15} />
            {filter !== 'all' && <span className="text-xs">{empById(filter)?.name.split(' ')[0]}</span>}
          </button>
        </div>

        {/* Filter bar */}
        <div className={`mb-4 ${showFilter || 'hidden md:flex'} flex-wrap items-center gap-2`}>
          {/* Avatar buttons */}
          <div className="flex -space-x-1">
            {MOCK_EMPLOYEES.map((emp, i) => (
              <button key={emp.id} onClick={() => { setFilter(filter === emp.id ? 'all' : emp.id); setShowFilter(false) }}
                title={emp.name}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2"
                style={{
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  color: AVATAR_TEXT[i % AVATAR_TEXT.length],
                  borderColor: filter === emp.id ? '#8B5CF6' : '#080B14',
                  transform: filter === emp.id ? 'scale(1.15)' : 'scale(1)',
                  minWidth: '32px',
                  minHeight: '32px',
                }}>
                {empInitials(emp.name)}
              </button>
            ))}
          </div>
          {/* Select — font-size 16px prevents iOS zoom */}
          <select value={filter} onChange={e => { setFilter(e.target.value); setShowFilter(false) }}
            className="rounded-lg text-sm outline-none"
            style={{ background: '#111525', border: '1px solid #1E2340', color: '#E8ECF4', padding: '8px 12px', fontSize: '16px', minHeight: '44px' }}>
            <option value="all">All Staff</option>
            {MOCK_EMPLOYEES.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')}
              className="flex items-center justify-center rounded-lg"
              style={{ background: '#111525', color: '#6B7280', width: '36px', height: '36px', border: '1px solid #1E2340' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Kanban board — horizontally scrollable with touch support */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            className="flex gap-3 pb-4"
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
          >
            {TASK_STAGES.map(stage => {
              const stageTasks = getTasksForStage(stage)
              const colors     = STAGE_COLORS[stage] ?? { bg: 'rgba(107,114,128,0.12)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' }

              return (
                <div key={stage} className="flex-shrink-0" style={{ width: '220px', scrollSnapAlign: 'start' }}>
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
                                    touchAction: 'none',
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

                                  {/* Client */}
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

                                  {/* Assigned employee — touch-friendly */}
                                  <div className="relative">
                                    <button
                                      onClick={() => setAssignOpen(assignOpen === task.id ? null : task.id)}
                                      className="w-full flex items-center gap-2 px-2 rounded-lg"
                                      style={{ background: '#0C0F1E', border: '1px solid #1A1F38', minHeight: '36px' }}>
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

                                    {assignOpen === task.id && (
                                      <div className="absolute left-0 right-0 bottom-full mb-1 rounded-lg overflow-hidden z-20"
                                        style={{ background: '#111525', border: '1px solid #2A2F50', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                                        {MOCK_EMPLOYEES.map((e, i) => (
                                          <button key={e.id} onClick={() => reassign(task.id, e.id)}
                                            className="w-full flex items-center gap-2 px-3 text-left"
                                            style={{ minHeight: '44px', borderBottom: i < MOCK_EMPLOYEES.length - 1 ? '1px solid #1A1F38' : 'none' }}>
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                              style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: AVATAR_TEXT[i % AVATAR_TEXT.length] }}>
                                              {empInitials(e.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-medium truncate" style={{ color: '#E8ECF4' }}>{e.name}</div>
                                              <div className="text-xs truncate" style={{ color: '#4B5563' }}>{e.role}</div>
                                            </div>
                                            {e.available && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10B981' }} />}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Delivery */}
                                  {stage === 'Ready to Send' && (
                                    <button onClick={() => handleDeliveryAction(task)}
                                      className="w-full mt-2 rounded-lg text-xs font-semibold"
                                      style={{
                                        minHeight: '40px',
                                        ...(task.session.payment_status === 'Paid in Full'
                                          ? { background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }
                                          : { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }),
                                      }}>
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
