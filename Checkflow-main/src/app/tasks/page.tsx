'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Settings2, Trash2 } from 'lucide-react'

const COLORS = ['#A78BFA','#60A5FA','#34D399','#FDE047','#FB923C','#F87171','#C084FC','#22D3EE']

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [pipelines, setPipelines] = useState<any[]>([])
  const [activePipeline, setActivePipeline] = useState<any>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showNewPipeline, setShowNewPipeline] = useState(false)
  const [newTaskStage, setNewTaskStage] = useState('')
  const [dragging, setDragging] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)

  const [taskForm, setTaskForm] = useState({ client_name:'', task_type:'', assigned_staff_ids:[] as string[], notes:'' })
  const [pipelineForm, setPipelineForm] = useState({ name:'', stages:[''] })

  const load = async () => {
    const [{data:t},{data:e},{data:p}] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('employees').select('id,name').order('name'),
      supabase.from('pipelines').select('*').order('name'),
    ])
    setTasks(t||[])
    setEmployees(e||[])
    const pList = p||[]
    setPipelines(pList)
    if (pList.length>0 && !activePipeline) setActivePipeline(pList[0])
  }
  useEffect(()=>{load()},[])

  const stages: string[] = activePipeline?.stages||[]

  const moveTask = async (taskId:string, stage:string) => {
    await supabase.from('tasks').update({ stage, status:stage }).eq('id',taskId)
    setTasks(t=>t.map(x=>x.id===taskId?{...x,stage,status:stage}:x))
  }

  const addTask = async () => {
    if (!taskForm.client_name.trim()||!newTaskStage) return
    setSaving(true)
    const {data,error} = await supabase.from('tasks').insert({
      client_name: taskForm.client_name.trim(),
      task_type: taskForm.task_type,
      stage: newTaskStage,
      status: newTaskStage,
      pipeline_name: activePipeline?.name||'Default',
      assigned_staff_ids: taskForm.assigned_staff_ids,
      assigned_to: taskForm.assigned_staff_ids[0]||null,
      notes: taskForm.notes,
    }).select().single()
    if (error) { alert('Save error: '+error.message); setSaving(false); return }
    if (data) setTasks(t=>[...t,data])
    setTaskForm({ client_name:'',task_type:'',assigned_staff_ids:[],notes:'' })
    setShowNewTask(false); setNewTaskStage(''); setSaving(false)
  }

  const deleteTask = async (id:string) => {
    await supabase.from('tasks').delete().eq('id',id)
    setTasks(t=>t.filter(x=>x.id!==id))
  }

  const deletePipeline = async (id:string, name:string) => {
    if (!confirm(`Delete pipeline "${name}"? Tasks in this pipeline will remain.`)) return
    await supabase.from('pipelines').delete().eq('id',id)
    const remaining = pipelines.filter(p=>p.id!==id)
    setPipelines(remaining)
    if (activePipeline?.id===id) setActivePipeline(remaining[0]||null)
  }

  const savePipeline = async () => {
    const name = pipelineForm.name.trim()
    const cleanStages = pipelineForm.stages.map(s=>s.trim()).filter(Boolean)
    if (!name||cleanStages.length===0) return
    setSaving(true)
    const {data,error} = await supabase.from('pipelines').insert({ name, stages:cleanStages }).select().single()
    if (error) { alert('Error: '+error.message); setSaving(false); return }
    if (data) { setPipelines(p=>[...p,data]); setActivePipeline(data) }
    setPipelineForm({ name:'',stages:[''] })
    setShowNewPipeline(false); setSaving(false)
  }

  const toggleStaff = (id:string) => setTaskForm(f=>({ ...f, assigned_staff_ids: f.assigned_staff_ids.includes(id)?f.assigned_staff_ids.filter(x=>x!==id):[...f.assigned_staff_ids,id] }))

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }

  return (
    <div style={{ padding:'28px 24px',minHeight:'100%',display:'flex',flexDirection:'column' }}>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(6,182,212,.12)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)' }}>TASKS</div>
          <h1 style={{ fontSize:24,fontWeight:700 }}>Task Pipeline</h1>
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <button onClick={()=>setShowNewPipeline(true)} className="btn btn-ghost"><Settings2 size={13}/> New Pipeline</button>
          <button onClick={()=>{setShowNewTask(true);setNewTaskStage(stages[0]||'')}} className="btn btn-primary"><Plus size={13}/> Add Task</button>
        </div>
      </div>

      {/* Pipeline tabs */}
      <div style={{ display:'flex',gap:6,marginBottom:16,flexWrap:'wrap' }}>
        {pipelines.map(p=>(
          <div key={p.id} style={{ display:'flex',alignItems:'center',gap:0 }}>
            <button onClick={()=>setActivePipeline(p)} style={{ padding:'6px 12px',borderRadius:'8px 0 0 8px',fontSize:13,fontWeight:500,cursor:'pointer',background:activePipeline?.id===p.id?'rgba(139,92,246,.2)':'#1A1030',color:activePipeline?.id===p.id?'#A78BFA':'#6B7280',border:`1px solid ${activePipeline?.id===p.id?'rgba(139,92,246,.4)':'#2D1F4E'}` }}>
              {p.name}
            </button>
            <button onClick={()=>deletePipeline(p.id,p.name)} style={{ padding:'6px 8px',borderRadius:'0 8px 8px 0',fontSize:11,cursor:'pointer',background:'rgba(239,68,68,.08)',color:'#F87171',border:'1px solid rgba(239,68,68,.2)',borderLeft:'none' }} title="Delete pipeline">
              <X size={11}/>
            </button>
          </div>
        ))}
      </div>

      {/* New Pipeline modal */}
      {showNewPipeline && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:480 }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308',marginBottom:14 }}>Create New Pipeline</h3>
            <label className="label">Pipeline Name</label>
            <input style={{ ...inp,marginBottom:14 }} placeholder="e.g. Video Production" value={pipelineForm.name} onChange={e=>setPipelineForm(f=>({...f,name:e.target.value}))} autoFocus/>
            <label className="label" style={{ marginBottom:8 }}>Stages <span style={{ color:'#4B5563',fontSize:10 }}>(press Enter to add)</span></label>
            {pipelineForm.stages.map((s,i)=>(
              <div key={i} style={{ display:'flex',gap:6,marginBottom:6 }}>
                <input style={{ flex:1,...inp }} placeholder={`Stage ${i+1}`} value={s}
                  onChange={e=>{const n=[...pipelineForm.stages];n[i]=e.target.value;setPipelineForm(f=>({...f,stages:n}))}}
                  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();setPipelineForm(f=>({...f,stages:[...f.stages,'']}));}}}/>
                {pipelineForm.stages.length>1&&<button onClick={()=>setPipelineForm(f=>({...f,stages:f.stages.filter((_,j)=>j!==i)}))} style={{ width:34,height:34,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><X size={13}/></button>}
              </div>
            ))}
            <button onClick={()=>setPipelineForm(f=>({...f,stages:[...f.stages,'']}))} style={{ marginBottom:14,padding:'7px 12px',background:'rgba(139,92,246,.1)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:8,fontSize:12,cursor:'pointer' }}>+ Add Stage</button>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={savePipeline} disabled={saving} className="btn btn-primary" style={{ flex:1 }}>Create Pipeline</button>
              <button onClick={()=>setShowNewPipeline(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New Task modal */}
      {showNewTask && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:460 }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308',marginBottom:14 }}>New Task</h3>
            {[{label:'Client Name *',key:'client_name',ph:'Client name'},{label:'Task Type',key:'task_type',ph:'e.g. Recording Session'}].map(({label,key,ph})=>(
              <div key={key} style={{ marginBottom:10 }}>
                <label className="label">{label}</label>
                <input style={inp} placeholder={ph} value={(taskForm as any)[key]} onChange={e=>setTaskForm(f=>({...f,[key]:e.target.value}))} autoFocus={key==='client_name'}/>
              </div>
            ))}
            <div style={{ marginBottom:10 }}>
              <label className="label">Stage</label>
              <select style={inp} value={newTaskStage} onChange={e=>setNewTaskStage(e.target.value)}>
                {stages.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="label">Assign Staff</label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {employees.map(e=>{
                  const sel = taskForm.assigned_staff_ids.includes(e.id)
                  return <button key={e.id} onClick={()=>toggleStaff(e.id)} style={{ padding:'5px 12px',borderRadius:20,fontSize:12,cursor:'pointer',background:sel?'rgba(139,92,246,.2)':'rgba(255,255,255,.04)',color:sel?'#A78BFA':'#6B7280',border:`1px solid ${sel?'rgba(139,92,246,.4)':'#2D1F4E'}` }}>{e.name}</button>
                })}
              </div>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={addTask} disabled={saving||!taskForm.client_name.trim()} className="btn btn-primary" style={{ flex:1 }}>{saving?'Saving…':'Add Task'}</button>
              <button onClick={()=>setShowNewTask(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div style={{ display:'flex',gap:10,overflowX:'auto',paddingBottom:12,flex:1 }}>
        {stages.map((stage,si)=>{
          const stageTasks = tasks.filter(t=>t.stage===stage&&t.pipeline_name===activePipeline?.name)
          const color = COLORS[si%COLORS.length]
          return (
            <div key={stage}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();if(dragging)moveTask(dragging,stage)}}
              style={{ minWidth:210,flex:'0 0 210px',background:'#0C0F1E',border:'1px solid #1A1F38',borderRadius:12,display:'flex',flexDirection:'column',overflow:'hidden' }}>
              <div style={{ padding:'9px 12px',borderBottom:'1px solid #1A1F38',display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`3px solid ${color}` }}>
                <span style={{ fontSize:11,fontWeight:600,color:'#9CA3AF' }}>{stage}</span>
                <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                  <span style={{ fontSize:10,padding:'1px 5px',borderRadius:4,background:'#1A1F38',color:'#6B7280',fontFamily:'monospace' }}>{stageTasks.length}</span>
                  <button onClick={()=>{setNewTaskStage(stage);setShowNewTask(true)}} style={{ width:18,height:18,background:'rgba(139,92,246,.1)',border:'none',borderRadius:4,color:'#A78BFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Plus size={11}/></button>
                </div>
              </div>
              <div style={{ padding:6,display:'flex',flexDirection:'column',gap:5,flex:1 }}>
                {stageTasks.map(t=>{
                  const names = employees.filter(e=>(t.assigned_staff_ids||[]).includes(e.id)).map((e:any)=>e.name)
                  return (
                    <div key={t.id} draggable onDragStart={()=>setDragging(t.id)} onDragEnd={()=>setDragging(null)}
                      style={{ background:'#111525',border:'1px solid #1E2340',borderRadius:8,padding:'9px 9px 9px 11px',borderLeft:`3px solid ${color}`,cursor:'grab',opacity:dragging===t.id ? 0.5 : 1 }}>
                      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:4 }}>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.client_name}</div>
                          {t.task_type&&<div style={{ fontSize:10,color:'#4B5563',marginTop:1 }}>{t.task_type}</div>}
                          {names.length>0&&<div style={{ display:'flex',flexWrap:'wrap',gap:3,marginTop:4 }}>{names.map((n:string)=><span key={n} style={{ fontSize:9,padding:'1px 5px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:10 }}>{n}</span>)}</div>}
                        </div>
                        <button onClick={()=>deleteTask(t.id)} style={{ background:'none',border:'none',color:'#374151',cursor:'pointer',flexShrink:0,padding:2 }}><X size={11}/></button>
                      </div>
                      <select value={t.stage} onChange={e=>moveTask(t.id,e.target.value)} style={{ marginTop:5,width:'100%',background:'#0C0F1E',border:'1px solid #1A1F38',borderRadius:5,padding:'2px 5px',fontSize:10,color:'#6B7280',outline:'none',cursor:'pointer',appearance:'none' }}>
                        {stages.map(s=><option key={s} value={s}>{s}</option>)}
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
