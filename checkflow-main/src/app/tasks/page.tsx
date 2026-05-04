'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Settings2 } from 'lucide-react'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [pipelines, setPipelines] = useState<any[]>([])
  const [activePipeline, setActivePipeline] = useState<any>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showNewPipeline, setShowNewPipeline] = useState(false)
  const [newTaskStage, setNewTaskStage] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)

  // New task form
  const [taskForm, setTaskForm] = useState({ client_name: '', task_type: '', assigned_staff_ids: [] as string[], notes: '' })
  // New pipeline form
  const [pipelineForm, setPipelineForm] = useState({ name: '', stages: [''] })

  const load = async () => {
    const [{ data: t }, { data: s }, { data: p }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('staff').select('id,name').order('name'),
      supabase.from('pipelines').select('*').order('name'),
    ])
    setTasks(t || [])
    setStaff(s || [])
    const pList = p || []
    setPipelines(pList)
    if (!activePipeline && pList.length > 0) setActivePipeline(pList[0])
  }

  useEffect(() => { load() }, [])

  const stages: string[] = activePipeline?.stages || []

  const moveTask = async (taskId: string, newStage: string) => {
    await supabase.from('tasks').update({ stage: newStage }).eq('id', taskId)
    setTasks(t => t.map(x => x.id === taskId ? { ...x, stage: newStage } : x))
  }

  const addTask = async () => {
    if (!taskForm.client_name.trim() || !newTaskStage) return
    const { data } = await supabase.from('tasks').insert({
      client_name: taskForm.client_name.trim(),
      task_type: taskForm.task_type,
      stage: newTaskStage,
      pipeline_name: activePipeline?.name || 'Default',
      assigned_staff_ids: taskForm.assigned_staff_ids,
      notes: taskForm.notes,
    }).select().single()
    if (data) setTasks(t => [...t, data])
    setTaskForm({ client_name: '', task_type: '', assigned_staff_ids: [], notes: '' })
    setShowNewTask(false)
    setNewTaskStage('')
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(t => t.filter(x => x.id !== id))
  }

  const savePipeline = async () => {
    const name = pipelineForm.name.trim()
    const cleanStages = pipelineForm.stages.map(s => s.trim()).filter(Boolean)
    if (!name || cleanStages.length === 0) return
    const { data } = await supabase.from('pipelines').insert({ name, stages: cleanStages }).select().single()
    if (data) { setPipelines(p => [...p, data]); setActivePipeline(data) }
    setPipelineForm({ name: '', stages: [''] })
    setShowNewPipeline(false)
  }

  const toggleStaff = (id: string) => {
    setTaskForm(f => ({
      ...f,
      assigned_staff_ids: f.assigned_staff_ids.includes(id) ? f.assigned_staff_ids.filter(x => x !== id) : [...f.assigned_staff_ids, id]
    }))
  }

  const STAGE_COLORS = ['#A78BFA','#60A5FA','#34D399','#FDE047','#FB923C','#F87171','#C084FC','#22D3EE']

  return (
    <div style={{ padding: '32px 24px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.12)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.25)', display: 'inline-block', marginBottom: 4 }}>TASKS</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8ECF4' }}>Task Pipeline</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowNewPipeline(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Settings2 size={14} /> New Pipeline
          </button>
          <button onClick={() => { setShowNewTask(true); setNewTaskStage(stages[0] || '') }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Pipeline tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {pipelines.map(p => (
          <button key={p.id} onClick={() => setActivePipeline(p)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: activePipeline?.id === p.id ? 'rgba(139,92,246,0.2)' : '#1A1030', color: activePipeline?.id === p.id ? '#A78BFA' : '#6B7280', border: `1px solid ${activePipeline?.id === p.id ? 'rgba(139,92,246,0.4)' : '#2D1F4E'}` }}>
            {p.name}
          </button>
        ))}
      </div>

      {/* New Pipeline modal */}
      {showNewPipeline && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#0C0F1E', border: '1px solid #2D1F4E', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAB308', marginBottom: 16 }}>Create New Pipeline</h3>
            <label style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' as const }}>Pipeline Name</label>
            <input style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#E8ECF4', width: '100%', outline: 'none', marginBottom: 16 }}
              placeholder="e.g. Video Production" value={pipelineForm.name} onChange={e => setPipelineForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <label style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' as const }}>Stages (one per line)</label>
            {pipelineForm.stages.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input style={{ flex: 1, background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E8ECF4', outline: 'none' }}
                  placeholder={`Stage ${i + 1}`} value={s}
                  onChange={e => { const n = [...pipelineForm.stages]; n[i] = e.target.value; setPipelineForm(f => ({ ...f, stages: n })) }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setPipelineForm(f => ({ ...f, stages: [...f.stages, ''] })) } }} />
                {pipelineForm.stages.length > 1 && (
                  <button onClick={() => setPipelineForm(f => ({ ...f, stages: f.stages.filter((_, j) => j !== i) }))} style={{ width: 36, height: 36, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={14} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setPipelineForm(f => ({ ...f, stages: [...f.stages, ''] }))} style={{ padding: '8px 12px', background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 12, cursor: 'pointer', marginBottom: 16 }}>+ Add Stage</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={savePipeline} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Create Pipeline</button>
              <button onClick={() => setShowNewPipeline(false)} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid #2D1F4E', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New Task modal */}
      {showNewTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#0C0F1E', border: '1px solid #2D1F4E', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAB308', marginBottom: 16 }}>New Task</h3>
            {[
              { label: 'Client Name *', key: 'client_name', placeholder: 'Client name' },
              { label: 'Task Type', key: 'task_type', placeholder: 'e.g. Recording Session' },
              { label: 'Notes', key: 'notes', placeholder: 'Optional notes' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>{label}</label>
                <input style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E8ECF4', width: '100%', outline: 'none' }}
                  placeholder={placeholder} value={(taskForm as any)[key]}
                  onChange={e => setTaskForm(f => ({ ...f, [key]: e.target.value }))} autoFocus={key === 'client_name'} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>Stage</label>
              <select style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E8ECF4', width: '100%', outline: 'none', appearance: 'none' }}
                value={newTaskStage} onChange={e => setNewTaskStage(e.target.value)}>
                {stages.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>Assign Staff</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {staff.map(s => {
                  const sel = taskForm.assigned_staff_ids.includes(s.id)
                  return (
                    <button key={s.id} onClick={() => toggleStaff(s.id)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: sel ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: sel ? '#A78BFA' : '#6B7280', border: `1px solid ${sel ? 'rgba(139,92,246,0.4)' : '#2D1F4E'}` }}>
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addTask} disabled={!taskForm.client_name.trim()} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: !taskForm.client_name.trim() ? .5 : 1 }}>Add Task</button>
              <button onClick={() => setShowNewTask(false)} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid #2D1F4E', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, flex: 1 }}>
        {stages.map((stage, si) => {
          const stageTasks = tasks.filter(t => t.stage === stage && t.pipeline_name === activePipeline?.name)
          const color = STAGE_COLORS[si % STAGE_COLORS.length]
          return (
            <div key={stage}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragging) moveTask(dragging, stage) }}
              style={{ minWidth: 220, flex: '0 0 220px', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #1A1F38', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `3px solid ${color}` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>{stage}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#1A1F38', color: '#6B7280', fontFamily: 'monospace' }}>{stageTasks.length}</span>
                  <button onClick={() => { setNewTaskStage(stage); setShowNewTask(true) }} style={{ width: 20, height: 20, background: 'rgba(139,92,246,0.1)', border: 'none', borderRadius: 4, color: '#A78BFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                </div>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {stageTasks.map(t => {
                  const assignedNames = staff.filter(s => (t.assigned_staff_ids || []).includes(s.id)).map(s => s.name)
                  return (
                    <div key={t.id} draggable
                      onDragStart={() => setDragging(t.id)}
                      onDragEnd={() => setDragging(null)}
                      style={{ background: '#111525', border: `1px solid #1E2340`, borderRadius: 8, padding: '10px 10px 10px 12px', borderLeft: `3px solid ${color}`, cursor: 'grab', opacity: dragging === t.id ? .5 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#E8ECF4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.client_name}</div>
                          {t.task_type && <div style={{ fontSize: 10, color: '#4B5563', marginTop: 1 }}>{t.task_type}</div>}
                          {assignedNames.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5 }}>
                              {assignedNames.map(n => (
                                <span key={n} style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10 }}>{n}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', flexShrink: 0, padding: 2 }}><X size={12} /></button>
                      </div>
                      {/* Stage mover */}
                      <select value={t.stage} onChange={e => moveTask(t.id, e.target.value)}
                        style={{ marginTop: 6, width: '100%', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 6, padding: '3px 6px', fontSize: 10, color: '#6B7280', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
