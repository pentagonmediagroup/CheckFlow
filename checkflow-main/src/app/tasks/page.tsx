'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { logAudit } from '@/lib/audit'
import { Plus, X, Settings2, CheckCircle2, Lock } from 'lucide-react'

const COLORS = ['#A78BFA','#60A5FA','#34D399','#FDE047','#FB923C','#F87171','#C084FC','#22D3EE']
const DONE_STAGE = 'Completed / Done'

export default function TasksPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [tasks, setTasks]         = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [pipelines, setPipelines] = useState<any[]>([])
  const [activePL, setActivePL]   = useState<any>(null)
  const [showTask, setShowTask]   = useState(false)
  const [showPL, setShowPL]       = useState(false)
  const [taskStage, setTaskStage] = useState('')
  const [saving, setSaving]       = useState(false)
  const [dragging, setDragging]   = useState<string|null>(null)
  const [dragOver, setDragOver]   = useState<string|null>(null)
  const touchTask  = useRef<string|null>(null)
  const touchStage = useRef<string|null>(null)

  const [tf, setTf] = useState({ client_name:'', task_type:'', assigned_staff_ids:[] as string[], notes:'' })
  const [plf, setPlf] = useState({ name:'', stages:[''] })

  const load = async () => {
    const [{ data:t },{ data:e },{ data:p }] = await Promise.all([
      supabase.from('tasks').select('*').eq('archived',false).order('created_at'),
      supabase.from('employees').select('id,name').order('name'),
      supabase.from('pipelines').select('*').order('name'),
    ])
    setTasks(t||[])
    setEmployees(e||[])
    const pl = p||[]
    // Ensure every pipeline has DONE as last stage
    const enriched = pl.map((p:any) => {
      const stages: string[] = p.stages || []
      if (stages[stages.length-1] !== DONE_STAGE) return { ...p, stages:[...stages, DONE_STAGE] }
      return p
    })
    setPipelines(enriched)
    if (!activePL && enriched.length) setActivePL(enriched[0])
  }
  useEffect(() => { load() }, [])

  const stages: string[] = activePL ? [...(activePL.stages||[]).filter((s:string)=>s!==DONE_STAGE), DONE_STAGE] : []

  const moveTask = async (taskId: string, stage: string) => {
    // Only owner can move to DONE
    if (stage === DONE_STAGE && !isOwner) return
    const patch: any = { stage, status:stage }
    if (stage === DONE_STAGE) {
      patch.completed_at = new Date().toISOString()
      patch.approved_by  = user?.username
    }
    await supabase.from('tasks').update(patch).eq('id', taskId)
    setTasks(t => t.map(x => x.id===taskId ? {...x,...patch} : x))

    if (stage === DONE_STAGE) {
      const task = tasks.find(t => t.id===taskId)
      if (task) {
        // Archive to history_log
        await supabase.from('history_log').insert({
          record_type: 'task',
          client_name:   task.client_name,
          service:       task.task_type,
          task_stage:    DONE_STAGE,
          task_pipeline: task.pipeline_name,
          notes:         task.notes,
          original_id:   task.id,
        })
        await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'APPROVE', category:'task', target_name:task.client_name, detail:`Task approved and moved to ${DONE_STAGE}` })
      }
    }
  }

  // Archive tasks in DONE after configurable period
  const archiveOldDone = async () => {
    const { data: settings } = await supabase.from('studio_settings').select('value').eq('key','archive_after_days').single()
    const days = parseInt(settings?.value||'30')
    const cutoff = new Date(Date.now() - days*24*60*60*1000).toISOString()
    await supabase.from('tasks').update({ archived:true }).eq('stage', DONE_STAGE).lt('completed_at', cutoff)
  }

  const addTask = async () => {
    if (!tf.client_name.trim() || !taskStage) return
    setSaving(true)
    const { data, error } = await supabase.from('tasks').insert({
      client_name: tf.client_name.trim(), task_type:tf.task_type,
      stage:taskStage, status:taskStage,
      pipeline_name:activePL?.name||'Default',
      assigned_staff_ids:tf.assigned_staff_ids,
      assigned_to:tf.assigned_staff_ids[0]||null,
      notes:tf.notes,
    }).select().single()
    if (error) { alert('Save error: '+error.message); setSaving(false); return }
    if (data) setTasks(t=>[...t,data])
    setTf({ client_name:'',task_type:'',assigned_staff_ids:[],notes:'' })
    setShowTask(false); setTaskStage(''); setSaving(false)
  }

  const deleteTask = async (id: string) => {
    const task = tasks.find(t=>t.id===id)
    await supabase.from('tasks').delete().eq('id',id)
    setTasks(t=>t.filter(x=>x.id!==id))
    // Move to history log
    if (task) await supabase.from('history_log').insert({ record_type:'task', client_name:task.client_name, service:task.task_type, task_stage:task.stage, task_pipeline:task.pipeline_name, notes:task.notes, original_id:task.id })
  }

  const deletePL = async (id: string, name: string) => {
    if (!confirm(`Delete pipeline "${name}"?`)) return
    await supabase.from('pipelines').delete().eq('id',id)
    const rem = pipelines.filter(p=>p.id!==id)
    setPipelines(rem); if (activePL?.id===id) setActivePL(rem[0]||null)
  }

  const savePL = async () => {
    const name = plf.name.trim()
    let st = plf.stages.map(s=>s.trim()).filter(Boolean)
    if (!name || !st.length) return
    // Always append DONE as last stage
    if (st[st.length-1] !== DONE_STAGE) st = [...st, DONE_STAGE]
    setSaving(true)
    const { data, error } = await supabase.from('pipelines').insert({ name, stages:st }).select().single()
    if (error) { alert(error.message); setSaving(false); return }
    if (data) { setPipelines(p=>[...p,data]); setActivePL(data) }
    setPlf({ name:'',stages:[''] }); setShowPL(false); setSaving(false)
  }

  const toggleStaff = (id:string) => setTf(f=>({ ...f, assigned_staff_ids:f.assigned_staff_ids.includes(id)?f.assigned_staff_ids.filter(x=>x!==id):[...f.assigned_staff_ids,id] }))

  const handleTouchStart = (taskId:string) => { touchTask.current=taskId }
  const handleTouchMove  = (e:React.TouchEvent) => { const el=document.elementFromPoint(e.touches[0].clientX,e.touches[0].clientY) as HTMLElement|null; touchStage.current=el?.closest('[data-stage]')?.getAttribute('data-stage')||null }
  const handleTouchEnd   = () => { if(touchTask.current&&touchStage.current) moveTask(touchTask.current,touchStage.current); touchTask.current=null; touchStage.current=null }

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }

  return (
    <div style={{ padding:'28px 24px',minHeight:'100%',display:'flex',flexDirection:'column' }}>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(6,182,212,.12)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)' }}>TASKS</div>
          <h1 style={{ fontSize:24,fontWeight:700 }}>Task Pipeline</h1>
          <p style={{ fontSize:12,color:'#4B5563',marginTop:2 }}>Drag to move · Owner-only approval for {DONE_STAGE}</p>
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <button onClick={()=>setShowPL(true)} className="btn btn-ghost"><Settings2 size={13}/> New Pipeline</button>
          <button onClick={()=>{setShowTask(true);setTaskStage(stages[0]||'')}} className="btn btn-primary"><Plus size={13}/> Add Task</button>
        </div>
      </div>

      {/* Pipeline tabs */}
      <div style={{ display:'flex',gap:6,marginBottom:14,flexWrap:'wrap' }}>
        {pipelines.map(p=>(
          <div key={p.id} style={{ display:'flex' }}>
            <button onClick={()=>setActivePL(p)} style={{ padding:'6px 12px',borderRadius:'8px 0 0 8px',fontSize:13,cursor:'pointer',fontWeight:activePL?.id===p.id?700:400,background:activePL?.id===p.id?'rgba(139,92,246,.2)':'#1A1030',color:activePL?.id===p.id?'#A78BFA':'#6B7280',border:`1px solid ${activePL?.id===p.id?'rgba(139,92,246,.4)':'#2D1F4E'}` }}>{p.name}</button>
            <button onClick={()=>deletePL(p.id,p.name)} style={{ padding:'6px 8px',borderRadius:'0 8px 8px 0',cursor:'pointer',background:'rgba(239,68,68,.08)',color:'#F87171',border:'1px solid rgba(239,68,68,.2)',borderLeft:'none' }}><X size={11}/></button>
          </div>
        ))}
      </div>

      {/* New Pipeline modal */}
      {showPL && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto' }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308',marginBottom:14 }}>Create New Pipeline</h3>
            <label className="label">Pipeline Name</label>
            <input style={{ ...inp,marginBottom:14 }} placeholder="e.g. Video Production" value={plf.name} onChange={e=>setPlf(f=>({...f,name:e.target.value}))} autoFocus/>
            <label className="label" style={{ marginBottom:8 }}>Stages <span style={{ color:'#4B5563',fontSize:10 }}>(Enter to add · "{DONE_STAGE}" added automatically as final stage)</span></label>
            {plf.stages.map((s,i)=>(
              <div key={i} style={{ display:'flex',gap:6,marginBottom:6 }}>
                <input style={{ flex:1,...inp }} placeholder={`Stage ${i+1}`} value={s}
                  onChange={e=>{const n=[...plf.stages];n[i]=e.target.value;setPlf(f=>({...f,stages:n}))}}
                  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();setPlf(f=>({...f,stages:[...f.stages,'']}));}}}/>
                {plf.stages.length>1&&<button onClick={()=>setPlf(f=>({...f,stages:f.stages.filter((_,j)=>j!==i)}))} style={{ width:34,height:34,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><X size={13}/></button>}
              </div>
            ))}
            {/* Preview final stage */}
            <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',borderRadius:8,marginBottom:12,marginTop:4 }}>
              <CheckCircle2 size={13} style={{ color:'#34D399' }}/>
              <span style={{ fontSize:12,color:'#34D399',fontWeight:600 }}>{DONE_STAGE}</span>
              <span style={{ fontSize:11,color:'#4B5563' }}>— auto-added as final stage (owner-only)</span>
            </div>
            <button onClick={()=>setPlf(f=>({...f,stages:[...f.stages,'']}))} style={{ marginBottom:14,padding:'7px 12px',background:'rgba(139,92,246,.1)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:8,fontSize:12,cursor:'pointer' }}>+ Add Stage</button>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={savePL} disabled={saving} className="btn btn-primary" style={{ flex:1 }}>Create Pipeline</button>
              <button onClick={()=>setShowPL(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New Task modal */}
      {showTask && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto' }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308',marginBottom:14 }}>New Task</h3>
            {[{l:'Client Name *',k:'client_name',ph:'Client name'},{l:'Task Type',k:'task_type',ph:'e.g. Recording'}].map(({l,k,ph})=>(
              <div key={k} style={{ marginBottom:10 }}>
                <label className="label">{l}</label>
                <input style={inp} placeholder={ph} value={(tf as any)[k]} onChange={e=>setTf(f=>({...f,[k]:e.target.value}))} autoFocus={k==='client_name'}/>
              </div>
            ))}
            <div style={{ marginBottom:10 }}>
              <label className="label">Stage</label>
              <select style={inp} value={taskStage} onChange={e=>setTaskStage(e.target.value)}>
                {stages.filter(s=>s!==DONE_STAGE).map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="label">Assign Staff</label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:4 }}>
                {employees.map(e=>{ const sel=tf.assigned_staff_ids.includes(e.id); return <button key={e.id} onClick={()=>toggleStaff(e.id)} style={{ padding:'5px 12px',borderRadius:20,fontSize:12,cursor:'pointer',background:sel?'rgba(139,92,246,.2)':'rgba(255,255,255,.04)',color:sel?'#A78BFA':'#6B7280',border:`1px solid ${sel?'rgba(139,92,246,.4)':'#2D1F4E'}` }}>{e.name}</button> })}
                {employees.length===0&&<span style={{ fontSize:12,color:'#4B5563' }}>No staff added yet</span>}
              </div>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={addTask} disabled={saving||!tf.client_name.trim()} className="btn btn-primary" style={{ flex:1 }}>{saving?'Saving…':'Add Task'}</button>
              <button onClick={()=>setShowTask(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div style={{ display:'flex',gap:10,overflowX:'auto',paddingBottom:12,flex:1,WebkitOverflowScrolling:'touch' as any }}>
        {stages.map((stage,si)=>{
          const isDone = stage === DONE_STAGE
          const stageTasks = tasks.filter(t=>t.stage===stage&&t.pipeline_name===activePL?.name)
          const color = isDone ? '#34D399' : COLORS[si%COLORS.length]
          return (
            <div key={stage} data-stage={stage}
              onDragOver={e=>{e.preventDefault();setDragOver(stage)}}
              onDragLeave={()=>setDragOver(null)}
              onDrop={e=>{e.preventDefault();if(dragging)moveTask(dragging,stage);setDragging(null);setDragOver(null)}}
              style={{ minWidth:220,flex:'0 0 220px',background:dragOver===stage?'rgba(139,92,246,.06)':'#0C0F1E',border:`1px solid ${dragOver===stage?'rgba(139,92,246,.4)':'#1A1F38'}`,borderRadius:12,display:'flex',flexDirection:'column',overflow:'hidden',transition:'border .15s' }}>
              <div style={{ padding:'9px 12px',borderBottom:'1px solid #1A1F38',display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`3px solid ${color}`,background:isDone?'rgba(16,185,129,.06)':'transparent' }}>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  {isDone && <CheckCircle2 size={13} style={{ color:'#34D399' }}/>}
                  {isDone && !isOwner && <Lock size={11} style={{ color:'#4B5563' }}/>}
                  <span style={{ fontSize:11,fontWeight:700,color:isDone?'#34D399':'#9CA3AF' }}>{stage}</span>
                  {isDone && <span style={{ fontSize:9,padding:'1px 5px',background:'rgba(16,185,129,.12)',color:'#34D399',border:'1px solid rgba(16,185,129,.2)',borderRadius:4 }}>OWNER ONLY</span>}
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                  <span style={{ fontSize:10,padding:'1px 5px',borderRadius:4,background:'#1A1F38',color:'#6B7280',fontFamily:'monospace' }}>{stageTasks.length}</span>
                  {!isDone && <button onClick={()=>{setTaskStage(stage);setShowTask(true)}} style={{ width:18,height:18,background:'rgba(139,92,246,.1)',border:'none',borderRadius:4,color:'#A78BFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Plus size={11}/></button>}
                </div>
              </div>
              <div style={{ padding:6,display:'flex',flexDirection:'column',gap:5,flex:1 }}>
                {stageTasks.map(t=>{
                  const names = employees.filter(e=>(t.assigned_staff_ids||[]).includes(e.id)).map((e:any)=>e.name)
                  const isLocked = isDone
                  return (
                    <div key={t.id}
                      draggable={!isLocked||(isLocked&&isOwner)}
                      onDragStart={()=>setDragging(t.id)}
                      onDragEnd={()=>{setDragging(null);setDragOver(null)}}
                      onTouchStart={()=>handleTouchStart(t.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      style={{ background:'#111525',border:`1px solid ${isDone?'rgba(16,185,129,.2)':'#1E2340'}`,borderRadius:8,padding:'9px 9px 9px 11px',borderLeft:`3px solid ${color}`,cursor:isLocked&&!isOwner?'default':'grab',opacity:dragging===t.id?0.5:1,touchAction:'none' }}>
                      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:4 }}>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.client_name}</div>
                          {t.task_type&&<div style={{ fontSize:10,color:'#4B5563',marginTop:1 }}>{t.task_type}</div>}
                          {isDone && t.completed_at && <div style={{ fontSize:9,color:'#34D399',marginTop:3 }}>✓ {new Date(t.completed_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>}
                          {isDone && t.approved_by && <div style={{ fontSize:9,color:'#4B5563',marginTop:1 }}>by @{t.approved_by}</div>}
                          {names.length>0&&<div style={{ display:'flex',flexWrap:'wrap',gap:3,marginTop:4 }}>{names.map((n:string)=><span key={n} style={{ fontSize:9,padding:'1px 5px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:10 }}>{n}</span>)}</div>}
                        </div>
                        {(!isLocked||isOwner)&&<button onClick={()=>deleteTask(t.id)} style={{ background:'none',border:'none',color:'#374151',cursor:'pointer',flexShrink:0,padding:2 }}><X size={11}/></button>}
                      </div>
                      {/* Move to Done button — owner only */}
                      {!isDone && isOwner && (
                        <button onClick={()=>moveTask(t.id,DONE_STAGE)}
                          style={{ marginTop:6,width:'100%',padding:'3px',background:'rgba(16,185,129,.1)',color:'#34D399',border:'1px solid rgba(16,185,129,.2)',borderRadius:5,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}>
                          <CheckCircle2 size={9}/> Approve & Complete
                        </button>
                      )}
                      {/* Stage mover — not for done */}
                      {!isDone && (
                        <select value={t.stage} onChange={e=>moveTask(t.id,e.target.value)}
                          style={{ marginTop:4,width:'100%',background:'#0C0F1E',border:'1px solid #1A1F38',borderRadius:6,padding:'2px 6px',fontSize:10,color:'#6B7280',outline:'none',cursor:'pointer',appearance:'none' }}>
                          {stages.filter(s=>s!==DONE_STAGE).map(s=><option key={s} value={s}>{s}</option>)}
                          {isOwner&&<option value={DONE_STAGE}>{DONE_STAGE}</option>}
                        </select>
                      )}
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
