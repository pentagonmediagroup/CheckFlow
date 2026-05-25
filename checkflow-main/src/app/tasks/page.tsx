'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { logAudit } from '@/lib/audit'
import {
  Plus, X, Settings2, CheckCircle2, Lock, Edit2, Check,
  ClipboardList, ChevronDown, ChevronRight, Upload,
  AlertCircle, RotateCcw, BookOpen, Trash2, FileText, CheckSquare
} from 'lucide-react'

// ─── Kanban constants ──────────────────────────────────────────
const COLORS = ['#A78BFA','#60A5FA','#34D399','#FDE047','#FB923C','#F87171','#C084FC','#22D3EE']
const DONE_STAGE = 'Completed / Done'

// ─── SOP types ────────────────────────────────────────────────
interface SOPStep {
  id: string; order: number; title: string; description: string; isRequired: boolean; estimatedMinutes?: number
}
interface SOP {
  id: string; name: string; description: string; category: string; status: 'active'|'draft'|'archived'
  steps: SOPStep[]; createdBy: string; createdAt: string; allowSkipWithPermission: boolean
}
interface StepProgress { stepId: string; status: 'pending'|'completed'|'skipped'; completedAt?: string; completedBy?: string; notes?: string }
interface SOPSession {
  id: string; sopId: string; userId: string; userName: string; startedAt: string; completedAt?: string
  steps: StepProgress[]; overallPercent: number; isComplete: boolean; device?: string
}

// ─── Studio B seed ────────────────────────────────────────────
const STUDIO_B: SOP = {
  id: 'sop-studio-b', name: 'Studio B', description: 'Standard operating procedure for opening, running, and closing Studio B sessions.',
  category: 'Studio Operations', status: 'active', allowSkipWithPermission: true,
  createdBy: 'system', createdAt: new Date().toISOString(),
  steps: [
    { id:'sb-01', order:1,  title:'Unlock & Access Studio B',    description:'Use keycard or code to unlock Studio B. Confirm room is clear from previous session. Check for leftover equipment or issues.', isRequired:true,  estimatedMinutes:2  },
    { id:'sb-02', order:2,  title:'Power On Console & Rack',      description:'Turn on the main power strip. Power on the mixing console first, then outboard gear. Allow 2 minutes for warm-up.',           isRequired:true,  estimatedMinutes:5  },
    { id:'sb-03', order:3,  title:'Boot DAW Workstation',         description:'Power on the Mac/PC. Open the DAW (Pro Tools / Logic). Confirm audio interface is recognized and session template loads.',        isRequired:true,  estimatedMinutes:5  },
    { id:'sb-04', order:4,  title:'Check Monitor Levels',         description:'Set monitor volume to reference level. Test left/right channels. Confirm no hum, buzz, or distortion.',                          isRequired:true,  estimatedMinutes:3  },
    { id:'sb-05', order:5,  title:'Inspect Mic Locker & Cables',  description:'Verify all microphones are present and stored correctly. Check XLR cables for damage. Set up mics per session requirements.',     isRequired:true,  estimatedMinutes:5  },
    { id:'sb-06', order:6,  title:'Set Up Live Room',             description:'Arrange instruments, stands, and headphone cue system per session rider or client request. Confirm talkback mic is functional.',   isRequired:true,  estimatedMinutes:10 },
    { id:'sb-07', order:7,  title:'Create & Label Session File',  description:'Create session file named: [ClientName_Date_ProjectName]. Save to the correct client folder on server. Enable auto-save.',         isRequired:true,  estimatedMinutes:3  },
    { id:'sb-08', order:8,  title:'Run Line Check',               description:'Test every input channel. Record a short test signal. Confirm gain staging is clean with no clipping.',                            isRequired:true,  estimatedMinutes:10 },
    { id:'sb-09', order:9,  title:'Confirm Client Arrival',       description:'Welcome client. Walk them through the session plan. Confirm any special requests, reference tracks, or technical requirements.',    isRequired:false, estimatedMinutes:5  },
    { id:'sb-10', order:10, title:'Session Wrap — Export & Backup',description:'Export final session stems/mix to client folder. Back up session to cloud/external drive. Confirm client has files.',             isRequired:true,  estimatedMinutes:15 },
    { id:'sb-11', order:11, title:'Teardown & Reset Room',        description:'Return all mics, cables, instruments to storage. Reset console faders to zero. Power down gear in reverse (DAW → console → strip).', isRequired:true, estimatedMinutes:10 },
    { id:'sb-12', order:12, title:'Log Session & Lock Up',        description:'Mark session complete in StudioFlow. Note any equipment issues in room log. Lock Studio B and return keycard.',                      isRequired:true,  estimatedMinutes:3  },
  ],
}

// ─── SOP localStorage helpers ─────────────────────────────────
function getSOPs(): SOP[] {
  try {
    const raw = localStorage.getItem('sf:sops')
    const stored: SOP[] = raw ? JSON.parse(raw) : []
    if (!stored.find(s => s.id === STUDIO_B.id)) {
      const seeded = [STUDIO_B, ...stored]
      localStorage.setItem('sf:sops', JSON.stringify(seeded))
      return seeded
    }
    return stored
  } catch { return [STUDIO_B] }
}
function saveSOPs(sops: SOP[]) {
  try { localStorage.setItem('sf:sops', JSON.stringify(sops)) } catch {}
}
function getSOPSessions(): SOPSession[] {
  try { return JSON.parse(localStorage.getItem('sf:sop-sessions') || '[]') } catch { return [] }
}
function saveSOPSession(s: SOPSession) {
  try {
    const all = getSOPSessions()
    const idx = all.findIndex(x => x.id === s.id)
    if (idx >= 0) all[idx] = s; else all.unshift(s)
    localStorage.setItem('sf:sop-sessions', JSON.stringify(all))
  } catch {}
}

type PageTab = 'pipeline' | 'sop'

export default function TasksPage() {
  const { user } = useAuth()
  const isOwner   = user?.role === 'owner'
  const isLimited = user?.role === 'employee' || user?.role === 'contractor'

  // ── Tab ───────────────────────────────────────────────────
  const [tab, setTab] = useState<PageTab>('pipeline')

  // ── Kanban state ─────────────────────────────────────────
  const [tasks,     setTasks]     = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [pipelines, setPipelines] = useState<any[]>([])
  const [activePL,  setActivePL]  = useState<any>(null)
  const [showTask,  setShowTask]  = useState(false)
  const [showPL,    setShowPL]    = useState(false)
  const [taskStage, setTaskStage] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [dragging,  setDragging]  = useState<string|null>(null)
  const [dragOver,  setDragOver]  = useState<string|null>(null)
  const [editCard,  setEditCard]  = useState<{ id:string; ids:string[] }|null>(null)
  const touchTask  = useRef<string|null>(null)
  const touchStage = useRef<string|null>(null)
  const [tf, setTf] = useState({ client_name:'', task_type:'', assigned_staff_ids:[] as string[], notes:'' })
  const [plf, setPlf] = useState({ name:'', stages:[''] })
  const myEmpId = user?.employee_id

  // ── SOP state ─────────────────────────────────────────────
  const [sops,           setSOPs]           = useState<SOP[]>([])
  const [activeSOP,      setActiveSOP]      = useState<SOP|null>(null)
  const [sopSession,     setSOPSession]     = useState<SOPSession|null>(null)
  const [sopHistory,     setSOPHistory]     = useState<SOPSession[]>([])
  const [sopView,        setSOPView]        = useState<'list'|'run'|'create'|'history'>('list')
  const [expandedStep,   setExpandedStep]   = useState<string|null>(null)
  const [skipModal,      setSkipModal]      = useState<SOPStep|null>(null)
  const [skipReason,     setSkipReason]     = useState('')
  const [noteModal,      setNoteModal]      = useState<SOPStep|null>(null)
  const [stepNote,       setStepNote]       = useState('')
  // Create SOP form
  const [newSOP, setNewSOP] = useState({ name:'', description:'', category:'Studio Operations', allowSkipWithPermission:true })
  const [newSteps, setNewSteps] = useState([{ title:'', description:'', isRequired:true, estimatedMinutes:'' }])
  const [uploadText, setUploadText] = useState('')
  const [parsing, setParsing] = useState(false)

  // ── Load data ─────────────────────────────────────────────
  const load = async () => {
    const [{ data:t },{ data:e },{ data:p }] = await Promise.all([
      supabase.from('tasks').select('*').eq('archived', false).order('created_at'),
      supabase.from('employees').select('id,name').order('name'),
      supabase.from('pipelines').select('*').order('name'),
    ])
    setTasks(t||[])
    setEmployees(e||[])
    const pl = p||[]
    const enriched = pl.map((p:any) => {
      const stages: string[] = p.stages||[]
      if (stages[stages.length-1] !== DONE_STAGE) return { ...p, stages:[...stages, DONE_STAGE] }
      return p
    })
    setPipelines(enriched)
    if (!activePL && enriched.length) setActivePL(enriched[0])
  }

  useEffect(() => {
    load()
    const loaded = getSOPs()
    setSOPs(loaded)
  }, [])

  // ── SOP helpers ───────────────────────────────────────────
  const startSOP = (sop: SOP) => {
    const sessionId = `${sop.id}-${Date.now()}`
    const session: SOPSession = {
      id: sessionId, sopId: sop.id, userId: user?.id||'', userName: user?.username||'',
      startedAt: new Date().toISOString(),
      steps: sop.steps.map(s => ({ stepId: s.id, status: 'pending' })),
      overallPercent: 0, isComplete: false, device: navigator.userAgent,
    }
    setSOPSession(session)
    saveSOPSession(session)
    setActiveSOP(sop)
    setSOPView('run')
    logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'SOP_STARTED', category:'task', target_name:sop.name, detail:`Started SOP: ${sop.name}` })
  }

  const completeStep = (step: SOPStep, notes?: string) => {
    if (!sopSession || !activeSOP) return
    // Enforce sequential — check all previous required steps are done
    const prevRequired = activeSOP.steps.filter(s => s.order < step.order && s.isRequired)
    const allPrevDone  = prevRequired.every(s => {
      const sp = sopSession.steps.find(p => p.stepId === s.id)
      return sp?.status === 'completed' || sp?.status === 'skipped'
    })
    if (!allPrevDone) { alert('Please complete all previous required steps first.'); return }

    const updatedSteps = sopSession.steps.map(sp =>
      sp.stepId === step.id
        ? { ...sp, status:'completed' as const, completedAt: new Date().toISOString(), completedBy: user?.username, notes }
        : sp
    )
    const done = updatedSteps.filter(s => s.status==='completed'||s.status==='skipped').length
    const pct  = Math.round((done / activeSOP.steps.length) * 100)
    const isComplete = done === activeSOP.steps.length

    const updated: SOPSession = { ...sopSession, steps: updatedSteps, overallPercent: pct, isComplete, completedAt: isComplete ? new Date().toISOString() : undefined }
    setSOPSession(updated)
    saveSOPSession(updated)

    // Audit
    logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action: isComplete ? 'SOP_COMPLETED' : 'SOP_STEP_DONE', category:'task', target_name:activeSOP.name, detail:`Step: "${step.title}"${notes?` — ${notes}`:''}` })

    // Also write to supabase audit_log for visibility in Settings > Audit Log
    supabase.from('audit_log').insert({
      actor_username: user?.username||'system', actor_role: user?.role||'employee',
      action: isComplete ? 'SOP_COMPLETED' : 'SOP_STEP',
      category: 'task',
      target_type: 'sop', target_name: activeSOP.name,
      detail: `Step ${step.order}: "${step.title}"${isComplete?' — SOP COMPLETE':''}`,
      metadata: { sop_id: activeSOP.id, step_id: step.id, step_order: step.order, session_id: sopSession.id, device: navigator.userAgent }
    }).then(() => {})

    if (isComplete) {
      setTimeout(() => {
        alert(`✅ SOP "${activeSOP.name}" complete! Great work.`)
        setSOPView('list')
        setSOPSession(null)
      }, 300)
    }
  }

  const skipStep = (step: SOPStep) => {
    if (!activeSOP?.allowSkipWithPermission && !isOwner) { alert('This step cannot be skipped.'); return }
    setSkipModal(step); setSkipReason('')
  }

  const confirmSkip = () => {
    if (!sopSession || !activeSOP || !skipModal) return
    if (!skipReason.trim()) { alert('Please provide a reason to skip.'); return }
    const updatedSteps = sopSession.steps.map(sp =>
      sp.stepId === skipModal.id ? { ...sp, status:'skipped' as const, completedBy: user?.username, notes: skipReason } : sp
    )
    const done = updatedSteps.filter(s => s.status==='completed'||s.status==='skipped').length
    const pct  = Math.round((done / activeSOP.steps.length) * 100)
    const updated = { ...sopSession, steps: updatedSteps, overallPercent: pct }
    setSOPSession(updated)
    saveSOPSession(updated)
    logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'SOP_STEP_SKIPPED', category:'task', target_name:activeSOP.name, detail:`Skipped: "${skipModal.title}" — Reason: ${skipReason}` })
    supabase.from('audit_log').insert({ actor_username:user?.username||'system', actor_role:user?.role||'employee', action:'SOP_STEP_SKIP', category:'task', target_type:'sop', target_name:activeSOP.name, detail:`Skipped step ${skipModal.order}: "${skipModal.title}" — Reason: ${skipReason}`, metadata:{ sop_id:activeSOP.id, step_id:skipModal.id, skip_reason:skipReason, session_id:sopSession.id } }).then(()=>{})
    setSkipModal(null)
  }

  const deleteSOP = (id: string) => {
    if (!confirm('Delete this SOP? This cannot be undone.')) return
    const updated = sops.filter(s => s.id !== id)
    saveSOPs(updated); setSOPs(updated)
  }

  // Parse free text into steps
  const parseTextIntoSteps = () => {
    if (!uploadText.trim()) return
    setParsing(true)
    const lines = uploadText.split('\n').map(l => l.trim()).filter(Boolean)
    const parsed = lines.map((line, i) => {
      const clean = line.replace(/^[\d\.\-\*\)]+\s*/, '').trim()
      return { title: clean.slice(0, 80), description: clean.length > 80 ? clean : '', isRequired: true, estimatedMinutes: '' }
    }).filter(s => s.title)
    if (parsed.length) setNewSteps(parsed)
    setParsing(false)
    setUploadText('')
  }

  const createSOP = () => {
    if (!newSOP.name.trim()) { alert('SOP name required'); return }
    const validSteps = newSteps.filter(s => s.title.trim())
    if (!validSteps.length) { alert('Add at least one step'); return }
    const sop: SOP = {
      id: `sop-${Date.now()}`, name: newSOP.name.trim(), description: newSOP.description.trim(),
      category: newSOP.category, status: 'active', allowSkipWithPermission: newSOP.allowSkipWithPermission,
      createdBy: user?.username||'system', createdAt: new Date().toISOString(),
      steps: validSteps.map((s, i) => ({
        id: `step-${Date.now()}-${i}`, order: i+1, title: s.title.trim(), description: s.description.trim(),
        isRequired: s.isRequired, estimatedMinutes: s.estimatedMinutes ? parseInt(s.estimatedMinutes) : undefined,
      })),
    }
    const updated = [...sops, sop]
    saveSOPs(updated); setSOPs(updated)
    logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'SOP_CREATED', category:'task', target_name:sop.name, detail:`Created SOP "${sop.name}" with ${sop.steps.length} steps` })
    setNewSOP({ name:'', description:'', category:'Studio Operations', allowSkipWithPermission:true })
    setNewSteps([{ title:'', description:'', isRequired:true, estimatedMinutes:'' }])
    setSOPView('list')
  }

  // ── Kanban helpers ────────────────────────────────────────
  const stages: string[] = activePL
    ? [...(activePL.stages||[]).filter((s:string)=>s!==DONE_STAGE), DONE_STAGE]
    : []

  const visibleTasks = (allTasks: any[]) => {
    if (isOwner) return allTasks
    if (!myEmpId) return []
    return allTasks.filter(t =>
      t.assigned_to === myEmpId ||
      (t.assigned_staff_ids||[]).includes(myEmpId) ||
      (t.assigned_employee_ids||[]).includes(myEmpId)
    )
  }

  const moveTask = async (taskId: string, stage: string) => {
    if (stage === DONE_STAGE && !isOwner) return
    const patch: any = { stage, status:stage }
    if (stage === DONE_STAGE) { patch.completed_at = new Date().toISOString(); patch.approved_by = user?.username }
    await supabase.from('tasks').update(patch).eq('id', taskId)
    setTasks(t => t.map(x => x.id===taskId ? {...x,...patch} : x))
    if (stage === DONE_STAGE) {
      const task = tasks.find(t=>t.id===taskId)
      if (task) {
        await supabase.from('history_log').insert({ record_type:'task', client_name:task.client_name, service:task.task_type, task_stage:DONE_STAGE, task_pipeline:task.pipeline_name, notes:task.notes, original_id:task.id })
        await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'APPROVE', category:'task', target_name:task.client_name, detail:`Approved and moved to ${DONE_STAGE}` })
      }
    }
  }

  const saveAssignment = async (taskId: string, ids: string[]) => {
    await supabase.from('tasks').update({ assigned_staff_ids: ids, assigned_employee_ids: ids, assigned_to: ids[0]||null }).eq('id', taskId)
    setTasks(t => t.map(x => x.id===taskId ? {...x, assigned_staff_ids:ids, assigned_employee_ids:ids, assigned_to:ids[0]||null} : x))
    setEditCard(null)
    await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'UPDATE', category:'task', target_name:tasks.find(t=>t.id===taskId)?.client_name||taskId, detail:`Reassigned task to ${ids.length} employee(s)` })
  }

  const addTask = async () => {
    if (!tf.client_name.trim()||!taskStage) return
    setSaving(true)
    const { data, error } = await supabase.from('tasks').insert({
      client_name: tf.client_name.trim(), task_type:tf.task_type,
      stage:taskStage, status:taskStage,
      pipeline_name:activePL?.name||'Default',
      assigned_staff_ids:tf.assigned_staff_ids,
      assigned_employee_ids:tf.assigned_staff_ids,
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
    if (task) await supabase.from('history_log').insert({ record_type:'task', client_name:task.client_name, service:task.task_type, task_stage:task.stage, task_pipeline:task.pipeline_name, notes:task.notes, original_id:task.id })
  }

  const deletePL = async (id:string, name:string) => {
    if (!confirm(`Delete pipeline "${name}"?`)) return
    await supabase.from('pipelines').delete().eq('id',id)
    const rem = pipelines.filter(p=>p.id!==id)
    setPipelines(rem); if(activePL?.id===id) setActivePL(rem[0]||null)
  }

  const savePL = async () => {
    const name = plf.name.trim()
    let st = plf.stages.map(s=>s.trim()).filter(Boolean)
    if (!name||!st.length) return
    if (st[st.length-1]!==DONE_STAGE) st=[...st,DONE_STAGE]
    setSaving(true)
    const { data, error } = await supabase.from('pipelines').insert({ name, stages:st }).select().single()
    if (error) { alert(error.message); setSaving(false); return }
    if (data) { setPipelines(p=>[...p,data]); setActivePL(data) }
    setPlf({ name:'',stages:[''] }); setShowPL(false); setSaving(false)
  }

  const toggleStaff     = (id:string) => setTf(f=>({ ...f, assigned_staff_ids:f.assigned_staff_ids.includes(id)?f.assigned_staff_ids.filter(x=>x!==id):[...f.assigned_staff_ids,id] }))
  const toggleEditStaff = (id:string) => setEditCard(ec => ec ? { ...ec, ids: ec.ids.includes(id)?ec.ids.filter(x=>x!==id):[...ec.ids,id] } : null)
  const handleTouchStart = (tid:string) => { touchTask.current=tid }
  const handleTouchMove  = (e:React.TouchEvent) => { const el=document.elementFromPoint(e.touches[0].clientX,e.touches[0].clientY) as HTMLElement|null; touchStage.current=el?.closest('[data-stage]')?.getAttribute('data-stage')||null }
  const handleTouchEnd   = () => { if(touchTask.current&&touchStage.current) moveTask(touchTask.current,touchStage.current); touchTask.current=null; touchStage.current=null }

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:10,padding:'12px 14px',fontSize:16,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }
  const sinp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:8,padding:'8px 12px',fontSize:13,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'28px 24px', minHeight:'100%', display:'flex', flexDirection:'column' }}>

      {/* ── Page header ── */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(6,182,212,.12)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)' }}>TASKS & SOPs</div>
          <h1 style={{ fontSize:24,fontWeight:700 }}>{tab==='sop' ? 'SOP Center' : 'Task Pipeline'}</h1>
          <p style={{ fontSize:12,color:'#4B5563',marginTop:2 }}>
            {tab==='sop' ? 'Standard Operating Procedures — step-by-step checklists for your studio' : (isLimited ? 'Showing tasks assigned to you' : 'All tasks · Drag to move · Owner-only approval for final stage')}
          </p>
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          {tab==='sop' && isOwner && sopView==='list' && <button onClick={()=>setSOPView('create')} className="btn btn-primary"><Plus size={13}/> New SOP</button>}
          {tab==='pipeline' && isOwner && <button onClick={()=>setShowPL(true)} className="btn btn-ghost"><Settings2 size={13}/> New Pipeline</button>}
          {tab==='pipeline' && <button onClick={()=>{setShowTask(true);setTaskStage(stages.find(s=>s!==DONE_STAGE)||'')}} className="btn btn-primary"><Plus size={13}/> Add Task</button>}
        </div>
      </div>

      {/* ── Top tabs: Pipeline / SOP ── */}
      <div style={{ display:'flex',gap:4,marginBottom:20,borderBottom:'1px solid #2D1F4E',paddingBottom:0 }}>
        {([['pipeline','Task Pipeline',CheckSquare],['sop','SOP',ClipboardList]] as const).map(([id,label,Icon])=>(
          <button key={id} onClick={()=>setTab(id as PageTab)}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:'8px 8px 0 0',fontSize:13,fontWeight:600,cursor:'pointer',border:'none',
              background: tab===id ? '#0C0F1E' : 'transparent',
              color: tab===id ? '#A78BFA' : '#4B5563',
              borderBottom: tab===id ? '2px solid #8B5CF6' : '2px solid transparent',
            }}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SOP TAB                                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'sop' && (
        <div style={{ flex:1 }}>

          {/* ── SOP List ── */}
          {sopView === 'list' && (
            <div>
              {sops.filter(s=>s.status==='active').map(sop => {
                const sessions = getSOPSessions().filter(s=>s.sopId===sop.id)
                const completed = sessions.filter(s=>s.isComplete).length
                return (
                  <div key={sop.id} className="card" style={{ padding:18, marginBottom:12 }}>
                    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap' }}>
                          <span style={{ fontSize:15,fontWeight:700 }}>{sop.name}</span>
                          <span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(16,185,129,.1)',color:'#34D399',border:'1px solid rgba(16,185,129,.2)' }}>{sop.category}</span>
                          <span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(139,92,246,.1)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)' }}>{sop.steps.length} steps</span>
                        </div>
                        {sop.description && <p style={{ fontSize:12,color:'#6B7280',marginBottom:8 }}>{sop.description}</p>}
                        <div style={{ fontSize:11,color:'#4B5563' }}>
                          {completed} completion{completed!==1?'s':''} · Est. {sop.steps.reduce((a,s)=>a+(s.estimatedMinutes||0),0)} min total
                        </div>
                      </div>
                      <div style={{ display:'flex',gap:8,flexShrink:0,flexWrap:'wrap' }}>
                        <button onClick={()=>{setSOPView('history');setActiveSOP(sop);setSopHistory(getSOPSessions().filter(s=>s.sopId===sop.id&&s.isComplete))}}
                          style={{ padding:'7px 12px',background:'rgba(255,255,255,.04)',color:'#6B7280',border:'1px solid #2D1F4E',borderRadius:8,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
                          <BookOpen size={12}/> History
                        </button>
                        {isOwner && sop.id !== 'sop-studio-b' && (
                          <button onClick={()=>deleteSOP(sop.id)}
                            style={{ padding:'7px 10px',background:'rgba(239,68,68,.08)',color:'#F87171',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
                            <Trash2 size={12}/>
                          </button>
                        )}
                        <button onClick={()=>startSOP(sop)} className="btn btn-primary" style={{ minHeight:36,padding:'0 16px',fontSize:13 }}>
                          ▶ Start SOP
                        </button>
                      </div>
                    </div>
                    {/* Step preview */}
                    <div style={{ marginTop:12,display:'flex',gap:4,flexWrap:'wrap' }}>
                      {sop.steps.slice(0,8).map((s,i)=>(
                        <div key={s.id} style={{ width:22,height:22,borderRadius:4,background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#A78BFA',fontWeight:700 }}>{i+1}</div>
                      ))}
                      {sop.steps.length>8&&<div style={{ width:22,height:22,borderRadius:4,background:'#1A1F38',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#4B5563' }}>+{sop.steps.length-8}</div>}
                    </div>
                  </div>
                )
              })}
              {sops.filter(s=>s.status==='active').length===0 && (
                <div style={{ textAlign:'center',padding:40,color:'#4B5563' }}>
                  <ClipboardList size={32} style={{ margin:'0 auto 12px',opacity:.3 }}/>
                  <p>No SOPs yet. {isOwner ? 'Create your first SOP.' : 'Ask your owner to create SOPs.'}</p>
                </div>
              )}
            </div>
          )}

          {/* ── SOP Runner ── */}
          {sopView === 'run' && activeSOP && sopSession && (
            <div>
              {/* Header */}
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap' }}>
                <button onClick={()=>{ if(confirm('Exit this SOP? Progress is auto-saved.')) setSOPView('list') }}
                  style={{ padding:'6px 12px',background:'rgba(255,255,255,.04)',color:'#6B7280',border:'1px solid #2D1F4E',borderRadius:8,fontSize:12,cursor:'pointer' }}>
                  ← Back
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16,fontWeight:700 }}>{activeSOP.name}</div>
                  <div style={{ fontSize:11,color:'#6B7280' }}>Running as @{user?.username}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:22,fontWeight:700,color:sopSession.overallPercent===100?'#34D399':'#A78BFA' }}>{sopSession.overallPercent}%</div>
                  <div style={{ fontSize:11,color:'#4B5563' }}>{sopSession.steps.filter(s=>s.status==='completed'||s.status==='skipped').length}/{activeSOP.steps.length} steps</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height:6,background:'#1A1F38',borderRadius:3,marginBottom:20,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${sopSession.overallPercent}%`,background:sopSession.overallPercent===100?'#34D399':'#8B5CF6',borderRadius:3,transition:'width .3s ease' }}/>
              </div>

              {/* Steps */}
              {activeSOP.steps.map(step => {
                const sp = sopSession.steps.find(p => p.stepId===step.id)!
                const isDone    = sp.status==='completed'
                const isSkipped = sp.status==='skipped'
                const isPrev    = activeSOP.steps.filter(s=>s.order<step.order&&s.isRequired).some(s=>{
                  const prev = sopSession.steps.find(p=>p.stepId===s.id)
                  return prev?.status==='pending'
                })
                const isExpanded = expandedStep===step.id

                return (
                  <div key={step.id} style={{ marginBottom:8,borderRadius:10,border:`1px solid ${isDone?'rgba(16,185,129,.3)':isSkipped?'rgba(107,114,128,.3)':isPrev?'#1A1F38':'rgba(139,92,246,.25)'}`,background:isDone?'rgba(16,185,129,.04)':isSkipped?'rgba(255,255,255,.02)':'#0C0F1E',opacity:isPrev?.6:1,transition:'all .2s' }}>
                    {/* Step header */}
                    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 14px',cursor:'pointer' }} onClick={()=>setExpandedStep(isExpanded?null:step.id)}>
                      {/* Status dot */}
                      <div style={{ width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                        background:isDone?'rgba(16,185,129,.2)':isSkipped?'rgba(107,114,128,.2)':'rgba(139,92,246,.12)',
                        border:`2px solid ${isDone?'#34D399':isSkipped?'#6B7280':'rgba(139,92,246,.4)'}` }}>
                        {isDone ? <Check size={13} style={{ color:'#34D399' }}/> : isSkipped ? <X size={13} style={{ color:'#6B7280' }}/> : <span style={{ fontSize:10,fontWeight:700,color:'#A78BFA' }}>{step.order}</span>}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:600,color:isDone?'#34D399':isSkipped?'#4B5563':'#E8ECF4',textDecoration:isSkipped?'line-through':'none' }}>{step.title}</div>
                        <div style={{ display:'flex',gap:8,marginTop:2,flexWrap:'wrap' }}>
                          {step.isRequired && !isDone && !isSkipped && <span style={{ fontSize:9,color:'#F87171',fontWeight:600 }}>REQUIRED</span>}
                          {step.estimatedMinutes && <span style={{ fontSize:9,color:'#4B5563' }}>~{step.estimatedMinutes} min</span>}
                          {isDone && <span style={{ fontSize:9,color:'#34D399' }}>✓ {new Date(sp.completedAt!).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>}
                          {isSkipped && <span style={{ fontSize:9,color:'#6B7280' }}>Skipped — {sp.notes}</span>}
                          {isPrev && <span style={{ fontSize:9,color:'#EAB308' }}>⚠ Complete previous required steps first</span>}
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown size={14} style={{ color:'#4B5563',flexShrink:0 }}/> : <ChevronRight size={14} style={{ color:'#4B5563',flexShrink:0 }}/>}
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ padding:'0 14px 14px 52px' }}>
                        {step.description && <p style={{ fontSize:13,color:'#9CA3AF',marginBottom:12,lineHeight:1.6 }}>{step.description}</p>}
                        {!isDone && !isSkipped && !isPrev && (
                          <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                            <button onClick={()=>{
                              if (sp.status==='pending' && !isPrev) {
                                setNoteModal(step); setStepNote('')
                              }
                            }} className="btn btn-primary" style={{ minHeight:36,padding:'0 16px',fontSize:13 }}>
                              ✓ Mark Complete
                            </button>
                            {(activeSOP.allowSkipWithPermission && isOwner) && (
                              <button onClick={()=>skipStep(step)}
                                style={{ padding:'0 14px',minHeight:36,background:'rgba(107,114,128,.1)',color:'#6B7280',border:'1px solid rgba(107,114,128,.2)',borderRadius:8,fontSize:13,cursor:'pointer' }}>
                                Skip
                              </button>
                            )}
                          </div>
                        )}
                        {isDone && sp.notes && <div style={{ fontSize:12,color:'#4B5563',fontStyle:'italic' }}>Note: {sp.notes}</div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── History ── */}
          {sopView === 'history' && activeSOP && (
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                <button onClick={()=>setSOPView('list')} style={{ padding:'6px 12px',background:'rgba(255,255,255,.04)',color:'#6B7280',border:'1px solid #2D1F4E',borderRadius:8,fontSize:12,cursor:'pointer' }}>← Back</button>
                <span style={{ fontSize:15,fontWeight:700 }}>{activeSOP.name} — Completion History</span>
              </div>
              {sopHistory.length === 0 && <div style={{ padding:32,textAlign:'center',color:'#4B5563' }}>No completions recorded yet.</div>}
              {sopHistory.map(s => (
                <div key={s.id} className="card" style={{ padding:14,marginBottom:10 }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
                    <div>
                      <span style={{ fontSize:13,fontWeight:600,color:'#34D399' }}>✓ Completed</span>
                      <span style={{ fontSize:12,color:'#6B7280',marginLeft:10 }}>by @{s.userName}</span>
                    </div>
                    <div style={{ fontSize:12,color:'#4B5563' }}>
                      {new Date(s.startedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                  <div style={{ marginTop:8,display:'flex',flexWrap:'wrap',gap:4 }}>
                    {s.steps.map(sp => {
                      const step = activeSOP.steps.find(x=>x.id===sp.stepId)
                      return (
                        <div key={sp.stepId} style={{ fontSize:10,padding:'2px 7px',borderRadius:4,
                          background:sp.status==='completed'?'rgba(16,185,129,.1)':'rgba(107,114,128,.1)',
                          color:sp.status==='completed'?'#34D399':'#6B7280',
                          border:`1px solid ${sp.status==='completed'?'rgba(16,185,129,.2)':'rgba(107,114,128,.2)'}` }}>
                          {sp.status==='completed'?'✓':'⊘'} {step?.title||sp.stepId}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Create SOP ── */}
          {sopView === 'create' && isOwner && (
            <div style={{ maxWidth:720 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20 }}>
                <button onClick={()=>setSOPView('list')} style={{ padding:'6px 12px',background:'rgba(255,255,255,.04)',color:'#6B7280',border:'1px solid #2D1F4E',borderRadius:8,fontSize:12,cursor:'pointer' }}>← Cancel</button>
                <span style={{ fontSize:15,fontWeight:700 }}>Create New SOP</span>
              </div>

              {/* Basic info */}
              <div className="card" style={{ padding:18,marginBottom:16 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'#EAB308',marginBottom:12,textTransform:'uppercase',letterSpacing:'.06em' }}>SOP Details</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
                  <div>
                    <label className="label">SOP Name *</label>
                    <input style={sinp} placeholder="e.g. Studio A Opening" value={newSOP.name} onChange={e=>setNewSOP(n=>({...n,name:e.target.value}))} autoFocus/>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <input style={sinp} placeholder="e.g. Studio Operations" value={newSOP.category} onChange={e=>setNewSOP(n=>({...n,category:e.target.value}))}/>
                  </div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label className="label">Description</label>
                  <input style={sinp} placeholder="Brief description of this SOP" value={newSOP.description} onChange={e=>setNewSOP(n=>({...n,description:e.target.value}))}/>
                </div>
                <label style={{ display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer' }}>
                  <input type="checkbox" checked={newSOP.allowSkipWithPermission} onChange={e=>setNewSOP(n=>({...n,allowSkipWithPermission:e.target.checked}))}/>
                  <span style={{ color:'#9CA3AF' }}>Allow owners to skip required steps with a reason</span>
                </label>
              </div>

              {/* Import from text */}
              <div className="card" style={{ padding:18,marginBottom:16 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'#EAB308',marginBottom:8,textTransform:'uppercase',letterSpacing:'.06em' }}>Import Steps from Text</div>
                <p style={{ fontSize:12,color:'#4B5563',marginBottom:10 }}>Paste a numbered list, bullet points, or plain text — each line becomes a step.</p>
                <textarea style={{ ...sinp,resize:'vertical' as any,minHeight:80,marginBottom:8,fontFamily:'monospace',fontSize:12 }} placeholder={"1. Unlock the studio\n2. Turn on the console\n3. Boot the DAW\n..."} value={uploadText} onChange={e=>setUploadText(e.target.value)}/>
                <button onClick={parseTextIntoSteps} disabled={!uploadText.trim()||parsing}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:8,fontSize:12,cursor:'pointer' }}>
                  <Upload size={12}/>{parsing?'Parsing…':'Import as Steps'}
                </button>
              </div>

              {/* Steps builder */}
              <div className="card" style={{ padding:18,marginBottom:16 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'#EAB308',marginBottom:12,textTransform:'uppercase',letterSpacing:'.06em' }}>Steps ({newSteps.length})</div>
                {newSteps.map((step,i)=>(
                  <div key={i} style={{ display:'flex',gap:8,marginBottom:12,alignItems:'flex-start' }}>
                    <div style={{ width:24,height:24,borderRadius:4,background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#A78BFA',fontWeight:700,flexShrink:0,marginTop:8 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <input style={{ ...sinp,marginBottom:6 }} placeholder={`Step ${i+1} title *`} value={step.title} onChange={e=>{const n=[...newSteps];n[i]={...n[i],title:e.target.value};setNewSteps(n)}}/>
                      <input style={{ ...sinp,marginBottom:6,fontSize:12 }} placeholder="Description (optional)" value={step.description} onChange={e=>{const n=[...newSteps];n[i]={...n[i],description:e.target.value};setNewSteps(n)}}/>
                      <div style={{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' }}>
                        <label style={{ display:'flex',alignItems:'center',gap:5,fontSize:12,cursor:'pointer',color:'#9CA3AF' }}>
                          <input type="checkbox" checked={step.isRequired} onChange={e=>{const n=[...newSteps];n[i]={...n[i],isRequired:e.target.checked};setNewSteps(n)}}/>
                          Required
                        </label>
                        <input style={{ ...sinp,width:90,padding:'4px 8px',fontSize:11 }} type="number" placeholder="Min" value={step.estimatedMinutes} onChange={e=>{const n=[...newSteps];n[i]={...n[i],estimatedMinutes:e.target.value};setNewSteps(n)}}/>
                        <span style={{ fontSize:11,color:'#4B5563' }}>est. minutes</span>
                      </div>
                    </div>
                    {newSteps.length>1 && (
                      <button onClick={()=>setNewSteps(s=>s.filter((_,j)=>j!==i))} style={{ width:28,height:28,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:6 }}><X size={12}/></button>
                    )}
                  </div>
                ))}
                <button onClick={()=>setNewSteps(s=>[...s,{title:'',description:'',isRequired:true,estimatedMinutes:''}])}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(139,92,246,.08)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:8,fontSize:12,cursor:'pointer' }}>
                  <Plus size={12}/> Add Step
                </button>
              </div>

              <div style={{ display:'flex',gap:8 }}>
                <button onClick={createSOP} className="btn btn-primary" style={{ flex:1,minHeight:44 }}>Create SOP</button>
                <button onClick={()=>setSOPView('list')} className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {/* ── Note modal ── */}
          {noteModal && (
            <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
              <div className="card" style={{ padding:24,width:'100%',maxWidth:420 }}>
                <h3 style={{ fontSize:15,fontWeight:700,marginBottom:4 }}>Complete: {noteModal.title}</h3>
                <p style={{ fontSize:12,color:'#6B7280',marginBottom:14 }}>Add an optional note before marking complete.</p>
                <textarea style={{ ...sinp,resize:'vertical' as any,minHeight:70,marginBottom:14 }} placeholder="Optional note or observation…" value={stepNote} onChange={e=>setStepNote(e.target.value)} autoFocus/>
                <div style={{ display:'flex',gap:8 }}>
                  <button onClick={()=>{completeStep(noteModal,stepNote||undefined);setNoteModal(null)}} className="btn btn-primary" style={{ flex:1 }}>✓ Mark Complete</button>
                  <button onClick={()=>setNoteModal(null)} className="btn btn-ghost">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Skip modal ── */}
          {skipModal && (
            <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
              <div className="card" style={{ padding:24,width:'100%',maxWidth:420 }}>
                <h3 style={{ fontSize:15,fontWeight:700,marginBottom:4,color:'#EAB308' }}>Skip Step: {skipModal.title}</h3>
                <p style={{ fontSize:12,color:'#6B7280',marginBottom:14 }}>This step is required. A reason is mandatory.</p>
                <textarea style={{ ...sinp,resize:'vertical' as any,minHeight:70,marginBottom:14 }} placeholder="Reason for skipping…" value={skipReason} onChange={e=>setSkipReason(e.target.value)} autoFocus/>
                <div style={{ display:'flex',gap:8 }}>
                  <button onClick={confirmSkip} style={{ flex:1,padding:'10px',background:'rgba(239,68,68,.12)',color:'#F87171',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,fontSize:13,cursor:'pointer',fontWeight:600 }}>Confirm Skip</button>
                  <button onClick={()=>setSkipModal(null)} className="btn btn-ghost">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* PIPELINE TAB (original kanban — unchanged)            */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'pipeline' && (
        <>
          {/* Pipeline tabs */}
          <div style={{ display:'flex',gap:6,marginBottom:14,flexWrap:'wrap' }}>
            {pipelines.map(p=>(
              <div key={p.id} style={{ display:'flex' }}>
                <button onClick={()=>setActivePL(p)} style={{ padding:'6px 12px',borderRadius:isOwner?'8px 0 0 8px':'8px',fontSize:13,cursor:'pointer',fontWeight:activePL?.id===p.id?700:400,background:activePL?.id===p.id?'rgba(139,92,246,.2)':'#1A1030',color:activePL?.id===p.id?'#A78BFA':'#6B7280',border:`1px solid ${activePL?.id===p.id?'rgba(139,92,246,.4)':'#2D1F4E'}` }}>{p.name}</button>
                {isOwner && <button onClick={()=>deletePL(p.id,p.name)} style={{ padding:'6px 8px',borderRadius:'0 8px 8px 0',cursor:'pointer',background:'rgba(239,68,68,.08)',color:'#F87171',border:'1px solid rgba(239,68,68,.2)',borderLeft:'none' }}><X size={11}/></button>}
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
                <label className="label" style={{ marginBottom:8 }}>Stages</label>
                {plf.stages.map((s,i)=>(
                  <div key={i} style={{ display:'flex',gap:6,marginBottom:6 }}>
                    <input style={{ flex:1,...inp }} placeholder={`Stage ${i+1}`} value={s}
                      onChange={e=>{const n=[...plf.stages];n[i]=e.target.value;setPlf(f=>({...f,stages:n}))}}
                      onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();setPlf(f=>({...f,stages:[...f.stages,'']}));}}}/> 
                    {plf.stages.length>1&&<button onClick={()=>setPlf(f=>({...f,stages:f.stages.filter((_,j)=>j!==i)}))} style={{ width:34,height:34,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><X size={13}/></button>}
                  </div>
                ))}
                <div style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 12px',background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',borderRadius:8,marginBottom:10,marginTop:4 }}>
                  <CheckCircle2 size={13} style={{ color:'#34D399' }}/>
                  <span style={{ fontSize:12,color:'#34D399',fontWeight:600 }}>{DONE_STAGE}</span>
                  <span style={{ fontSize:11,color:'#4B5563' }}>— auto-added as final stage</span>
                </div>
                <button onClick={()=>setPlf(f=>({...f,stages:[...f.stages,'']}))} style={{ marginBottom:12,padding:'7px 12px',background:'rgba(139,92,246,.1)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:8,fontSize:12,cursor:'pointer' }}>+ Add Stage</button>
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
                    {employees.length===0&&<span style={{ fontSize:12,color:'#4B5563' }}>No staff yet</span>}
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
              const isDone = stage===DONE_STAGE
              const allStageTasks = tasks.filter(t=>t.stage===stage&&t.pipeline_name===activePL?.name)
              const stageTasks = visibleTasks(allStageTasks)
              const color = isDone?'#34D399':COLORS[si%COLORS.length]

              return (
                <div key={stage} data-stage={stage}
                  onDragOver={e=>{e.preventDefault();setDragOver(stage)}}
                  onDragLeave={()=>setDragOver(null)}
                  onDrop={e=>{e.preventDefault();if(dragging)moveTask(dragging,stage);setDragging(null);setDragOver(null)}}
                  style={{ minWidth:230,flex:'0 0 230px',background:dragOver===stage?'rgba(139,92,246,.05)':'#0C0F1E',border:`1px solid ${dragOver===stage?'rgba(139,92,246,.4)':'#1A1F38'}`,borderRadius:12,display:'flex',flexDirection:'column',overflow:'hidden',transition:'border .15s' }}>
                  <div style={{ padding:'9px 12px',borderBottom:'1px solid #1A1F38',display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`3px solid ${color}`,background:isDone?'rgba(16,185,129,.05)':'transparent' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                      {isDone&&<CheckCircle2 size={13} style={{ color:'#34D399' }}/>}
                      {isDone&&!isOwner&&<Lock size={11} style={{ color:'#4B5563' }}/>}
                      <span style={{ fontSize:11,fontWeight:700,color:isDone?'#34D399':'#9CA3AF' }}>{stage}</span>
                      {isDone&&<span style={{ fontSize:9,padding:'1px 5px',background:'rgba(16,185,129,.12)',color:'#34D399',border:'1px solid rgba(16,185,129,.2)',borderRadius:4 }}>OWNER</span>}
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                      <span style={{ fontSize:10,padding:'1px 5px',borderRadius:4,background:'#1A1F38',color:'#6B7280',fontFamily:'monospace' }}>{stageTasks.length}</span>
                      {!isDone&&<button onClick={()=>{setTaskStage(stage);setShowTask(true)}} style={{ width:18,height:18,background:'rgba(139,92,246,.1)',border:'none',borderRadius:4,color:'#A78BFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Plus size={11}/></button>}
                    </div>
                  </div>

                  <div style={{ padding:6,display:'flex',flexDirection:'column',gap:5,flex:1 }}>
                    {stageTasks.map(t=>{
                      const names = employees.filter(e=>(t.assigned_staff_ids||t.assigned_employee_ids||[]).includes(e.id)).map((e:any)=>e.name)
                      const isEditing = editCard?.id===t.id

                      return (
                        <div key={t.id}
                          draggable={!isDone||(isDone&&isOwner)}
                          onDragStart={()=>setDragging(t.id)}
                          onDragEnd={()=>{setDragging(null);setDragOver(null)}}
                          onTouchStart={()=>handleTouchStart(t.id)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          style={{ background:'#111525',border:`1px solid ${isDone?'rgba(16,185,129,.2)':'#1E2340'}`,borderRadius:8,padding:'9px 9px 9px 11px',borderLeft:`3px solid ${color}`,cursor:isDone&&!isOwner?'default':'grab',opacity:dragging===t.id?.5:1,touchAction:'none' }}>
                          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:4 }}>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.client_name}</div>
                              {t.task_type&&<div style={{ fontSize:10,color:'#4B5563',marginTop:1 }}>{t.task_type}</div>}
                              {isDone&&t.completed_at&&<div style={{ fontSize:9,color:'#34D399',marginTop:3 }}>✓ {new Date(t.completed_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>}
                              {isDone&&t.approved_by&&<div style={{ fontSize:9,color:'#4B5563',marginTop:1 }}>by @{t.approved_by}</div>}
                            </div>
                            <div style={{ display:'flex',gap:3,flexShrink:0 }}>
                              <button onClick={()=>setEditCard(isEditing?null:{ id:t.id, ids:[...(t.assigned_staff_ids||t.assigned_employee_ids||[])] })}
                                style={{ width:20,height:20,background:isEditing?'rgba(139,92,246,.3)':'rgba(139,92,246,.1)',border:'none',borderRadius:4,color:'#A78BFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                                <Edit2 size={10}/>
                              </button>
                              {(isOwner || !isDone) && (
                                <button onClick={()=>deleteTask(t.id)}
                                  style={{ width:20,height:20,background:isDone?'rgba(239,68,68,.15)':'none',border:isDone?'1px solid rgba(239,68,68,.3)':'none',borderRadius:isDone?4:0,color:isDone?'#F87171':'#374151',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0 }}>
                                  <X size={11}/>
                                </button>
                              )}
                            </div>
                          </div>
                          {names.length>0&&!isEditing&&(
                            <div style={{ display:'flex',flexWrap:'wrap',gap:3,marginTop:5 }}>
                              {names.map((n:string)=><span key={n} style={{ fontSize:9,padding:'1px 5px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:10 }}>{n}</span>)}
                            </div>
                          )}
                          {isEditing&&(
                            <div style={{ marginTop:8,padding:'8px',background:'#0C0F1E',borderRadius:7,border:'1px solid #2D1F4E' }}>
                              <div style={{ fontSize:10,color:'#6B7280',marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em' }}>Assign Staff</div>
                              <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginBottom:8 }}>
                                {employees.map(e=>{ const sel = editCard!.ids.includes(e.id); return (
                                  <button key={e.id} onClick={()=>toggleEditStaff(e.id)}
                                    style={{ padding:'3px 9px',borderRadius:12,fontSize:11,cursor:'pointer',background:sel?'rgba(139,92,246,.25)':'rgba(255,255,255,.04)',color:sel?'#A78BFA':'#6B7280',border:`1px solid ${sel?'rgba(139,92,246,.5)':'#2D1F4E'}` }}>
                                    {sel&&'✓ '}{e.name}
                                  </button>
                                )})}
                              </div>
                              <div style={{ display:'flex',gap:5 }}>
                                <button onClick={()=>saveAssignment(t.id, editCard!.ids)}
                                  style={{ flex:1,padding:'5px',background:'rgba(16,185,129,.12)',color:'#34D399',border:'1px solid rgba(16,185,129,.25)',borderRadius:6,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}>
                                  <Check size={10}/> Save
                                </button>
                                <button onClick={()=>setEditCard(null)}
                                  style={{ padding:'5px 10px',background:'rgba(255,255,255,.04)',color:'#6B7280',border:'1px solid #2D1F4E',borderRadius:6,fontSize:11,cursor:'pointer' }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                          {!isDone&&isOwner&&(
                            <button onClick={()=>moveTask(t.id,DONE_STAGE)}
                              style={{ marginTop:6,width:'100%',padding:'3px',background:'rgba(16,185,129,.1)',color:'#34D399',border:'1px solid rgba(16,185,129,.2)',borderRadius:5,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}>
                              <CheckCircle2 size={9}/> Approve & Complete
                            </button>
                          )}
                          {!isDone&&(
                            <select value={t.stage} onChange={e=>moveTask(t.id,e.target.value)}
                              style={{ marginTop:4,width:'100%',background:'#0C0F1E',border:'1px solid #1A1F38',borderRadius:6,padding:'2px 6px',fontSize:10,color:'#6B7280',outline:'none',cursor:'pointer',appearance:'none' }}>
                              {stages.filter(s=>s!==DONE_STAGE).map(s=><option key={s} value={s}>{s}</option>)}
                              {isOwner&&<option value={DONE_STAGE}>{DONE_STAGE}</option>}
                            </select>
                          )}
                        </div>
                      )
                    })}
                    {stageTasks.length===0&&(
                      <div style={{ padding:'16px 8px',textAlign:'center',fontSize:11,color:'#374151' }}>
                        {isLimited&&allStageTasks.length>0?'No tasks assigned to you here':'Empty'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {stages.length===0&&<div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#4B5563',fontSize:14 }}>Select or create a pipeline.</div>}
          </div>
        </>
      )}
    </div>
  )
}
