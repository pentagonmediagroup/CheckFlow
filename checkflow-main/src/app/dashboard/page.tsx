'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { CalendarDays, SquareCheckBig, DollarSign, AlertCircle, ArrowRight, Clock, UserCog } from 'lucide-react'

const TASK_COLORS = ['#A78BFA','#60A5FA','#34D399','#FDE047','#FB923C','#F87171','#C084FC','#22D3EE']

export default function DashboardPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [sessions, setSessions] = useState<any[]>([])
  const [tasks, setTasks]       = useState<any[]>([])
  const [staff, setStaff]       = useState<any[]>([])
  const [kpi, setKpi]           = useState({ collected:0, owed:0, unpaid:0 })

  const fetchDashboard = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const cfUser = typeof window!=='undefined' ? JSON.parse(localStorage.getItem('cf_user')||'{}') : {}
    const myId = cfUser?.employee_id
    const isOwnerRole = cfUser?.role === 'owner'

    const [{ data:se }, { data:ta }, { data:st }, { data:cf }] = await Promise.all([
      supabase.from('sessions').select('id,client_name,session_type,service,studio,date,start_time,payment_status,amount_owed,amount_paid').gte('date',today).order('date').limit(5),
      supabase.from('tasks').select('id,client_name,task_type,stage,assigned_to,assigned_staff_ids,assigned_employee_ids').eq('archived',false).order('created_at').limit(50),
      supabase.from('employees').select('id,name,app_role,available,role').order('name').limit(8),
      // ✅ KPI query: only fetch the 3 columns needed, no duplication
      supabase.from('sessions').select('amount_owed,amount_paid,late_fee,payment_status'),
    ])

    setSessions(se||[])
    const allTasks = ta||[]
    setTasks(isOwnerRole ? allTasks : allTasks.filter((t:any) =>
      t.assigned_to === myId ||
      (t.assigned_staff_ids||[]).includes(myId) ||
      (t.assigned_employee_ids||[]).includes(myId)
    ))
    setStaff(st||[])
    const c = cf||[]
    setKpi({
      collected: c.reduce((s:number,r:any)=>s+(r.amount_paid||0),0),
      owed:      c.reduce((s:number,r:any)=>s+Math.max(0,(r.amount_owed||0)-(r.amount_paid||0)+(r.late_fee||0)),0),
      unpaid:    c.filter((r:any)=>r.payment_status==='Balance Due'||r.payment_status==='Deposit Paid').length,
    })
  }, [])

  useEffect(() => {
    fetchDashboard()
    // ✅ Realtime push instead of 30s polling
    // FIX: unique channel name per mount prevents realtime crash
    const channel = supabase.channel(`dashboard-live-${Date.now()}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'sessions' }, fetchDashboard)
      .on('postgres_changes', { event:'*', schema:'public', table:'tasks' },    fetchDashboard)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchDashboard])

  const today = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})

  return (
    <div className="page-pad">
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(139,92,246,.15)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)' }}>
            {isOwner ? 'OWNER DASHBOARD' : 'DASHBOARD'}
          </div>
          <h1 style={{ fontSize:24,fontWeight:700,color:'#fff',letterSpacing:'-.02em' }}>Studio Overview</h1>
          <p style={{ fontSize:13,color:'#6B7280',marginTop:2 }}>{today}</p>
        </div>
        <Link href="/book" className="btn btn-primary" style={{ minHeight:44,fontSize:14,whiteSpace:'nowrap' }}>⚡ Book</Link>
      </div>

      {/* KPIs — revenue only for owner */}
      <div className="g4" style={{ marginBottom:16 }}>
        {isOwner && (
          <div className="card" style={{ padding:14 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8 }}>
              <DollarSign size={14} style={{ color:'#34D399' }}/>
            </div>
            <div style={{ fontSize:24,fontWeight:700,color:'#fff',letterSpacing:'-.02em' }}>${kpi.collected.toFixed(0)}</div>
            <div style={{ fontSize:11,color:'#4B5563',marginTop:2 }}>Collected</div>
          </div>
        )}
        <div className="card" style={{ padding:14 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8 }}><CalendarDays size={14} style={{ color:'#A78BFA' }}/></div>
          <div style={{ fontSize:24,fontWeight:700,color:'#fff',letterSpacing:'-.02em' }}>{sessions.length}</div>
          <div style={{ fontSize:11,color:'#4B5563',marginTop:2 }}>Upcoming Sessions</div>
        </div>
        <div className="card" style={{ padding:14 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:'rgba(6,182,212,.12)',border:'1px solid rgba(6,182,212,.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8 }}><SquareCheckBig size={14} style={{ color:'#22D3EE' }}/></div>
          <div style={{ fontSize:24,fontWeight:700,color:'#fff',letterSpacing:'-.02em' }}>{tasks.length}</div>
          <div style={{ fontSize:11,color:'#4B5563',marginTop:2 }}>Active Tasks</div>
        </div>
        {/* Outstanding — visible to all */}
        <div className="card" style={{ padding:14 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:kpi.owed>0?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)',border:`1px solid ${kpi.owed>0?'rgba(239,68,68,.2)':'rgba(16,185,129,.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8 }}>
            <AlertCircle size={14} style={{ color:kpi.owed>0?'#F87171':'#34D399' }}/>
          </div>
          <div style={{ fontSize:24,fontWeight:700,color:'#fff',letterSpacing:'-.02em' }}>
            {isOwner ? `$${kpi.owed.toFixed(0)}` : `${kpi.unpaid}`}
          </div>
          <div style={{ fontSize:11,color:'#4B5563',marginTop:2 }}>{isOwner ? 'Outstanding' : 'Unpaid Sessions'}</div>
        </div>
      </div>

      {/* Sessions + Tasks */}
      <div className="g2" style={{ marginBottom:14 }}>
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 16px',borderBottom:'1px solid #2D1F4E' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <CalendarDays size={13} style={{ color:'#8B5CF6' }}/>
              <span style={{ fontSize:13,fontWeight:600 }}>Upcoming Sessions</span>
              <span style={{ fontSize:10,padding:'1px 6px',borderRadius:4,background:'rgba(139,92,246,.15)',color:'#A78BFA',fontFamily:'monospace' }}>{sessions.length}</span>
            </div>
            <Link href="/calendar" style={{ fontSize:11,color:'#EAB308',textDecoration:'none',display:'flex',alignItems:'center',gap:3 }}>All <ArrowRight size={11}/></Link>
          </div>
          {sessions.length===0&&<div style={{ padding:32,textAlign:'center',color:'#4B5563',fontSize:13 }}>No upcoming sessions</div>}
          {sessions.map(s=>(
            <Link key={s.id} href={`/sessions/${s.id}`} style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderBottom:'1px solid #1A1F38',textDecoration:'none' }}>
              <div style={{ width:34,height:34,borderRadius:8,background:s.studio==='Studio A'?'rgba(139,92,246,.2)':'rgba(6,182,212,.15)',color:s.studio==='Studio A'?'#A78BFA':'#22D3EE',border:`1px solid ${s.studio==='Studio A'?'rgba(139,92,246,.3)':'rgba(6,182,212,.3)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0 }}>
                {(s.client_name||'?').charAt(0)}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'140px' }}>{s.client_name}</div>
                <div style={{ fontSize:11,color:'#4B5563',marginTop:1 }}>{s.service||s.session_type} · {s.studio}</div>
              </div>
              <span style={{ fontSize:11,padding:'3px 7px',borderRadius:5,fontWeight:500,flexShrink:0,background:s.payment_status==='Paid in Full'?'rgba(16,185,129,.12)':'rgba(239,68,68,.1)',color:s.payment_status==='Paid in Full'?'#34D399':'#F87171',border:`1px solid ${s.payment_status==='Paid in Full'?'rgba(16,185,129,.25)':'rgba(239,68,68,.25)'}` }}>{s.payment_status}</span>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontSize:11 }}>{s.date}</div>
                <div style={{ fontSize:10,color:'#4B5563',display:'flex',alignItems:'center',gap:2,justifyContent:'flex-end',marginTop:1 }}><Clock size={9}/>{String(s.start_time||'').slice(11,16)}</div>
              </div>
            </Link>
          ))}
          <div style={{ padding:'10px 16px' }}>
            <Link href="/book" className="btn btn-ghost" style={{ width:'100%',minHeight:36 }}>+ Book New Session</Link>
          </div>
        </div>

        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 16px',borderBottom:'1px solid #2D1F4E' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <SquareCheckBig size={13} style={{ color:'#06B6D4' }}/>
              <span style={{ fontSize:13,fontWeight:600 }}>Task Pipeline</span>
              <span style={{ fontSize:10,padding:'1px 6px',borderRadius:4,background:'rgba(6,182,212,.12)',color:'#22D3EE',fontFamily:'monospace' }}>{tasks.length}</span>
            </div>
            <Link href="/tasks" style={{ fontSize:11,color:'#EAB308',textDecoration:'none',display:'flex',alignItems:'center',gap:3 }}>Board <ArrowRight size={11}/></Link>
          </div>
          <div style={{ padding:10,display:'flex',flexDirection:'column',gap:5,maxHeight:280,overflowY:'auto' }}>
            {tasks.length===0&&<div style={{ padding:24,textAlign:'center',color:'#4B5563',fontSize:13 }}>No tasks yet</div>}
            {tasks.map((t,i)=>{ const color=TASK_COLORS[i%TASK_COLORS.length]; return (
              <div key={t.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'#0C0F1E',border:'1px solid #1A1F38',borderRadius:8,borderLeft:`3px solid ${color}` }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.client_name}</div>
                  <div style={{ fontSize:10,color:'#374151' }}>{t.task_type}</div>
                </div>
                <span style={{ fontSize:10,padding:'2px 6px',borderRadius:4,background:`${color}20`,color,flexShrink:0 }}>{t.stage}</span>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* Staff */}
      <div className="card" style={{ padding:'12px 16px',marginBottom:14 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}><UserCog size={13} style={{ color:'#EAB308' }}/><span style={{ fontSize:13,fontWeight:600 }}>Staff On Deck</span></div>
          <Link href="/staff" style={{ fontSize:11,color:'#EAB308',textDecoration:'none' }}>Manage →</Link>
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          {staff.length===0&&<span style={{ fontSize:13,color:'#4B5563' }}>No staff added yet</span>}
          {staff.map(s=>(
            <div key={s.id} style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'#0C0F1E',border:'1px solid #1A1F38',borderRadius:20 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:s.available?'#34D399':'#6B7280' }}/>
              <span style={{ fontSize:12,fontWeight:500 }}>{s.name}</span>
              {s.role&&<span style={{ fontSize:10,color:'#4B5563' }}>{s.role}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="g4">
        {[
          { href:'/book',    label:'Book Session',  c:'#8B5CF6',bg:'rgba(139,92,246,.1)',b:'rgba(139,92,246,.2)' },
          { href:'/tasks',   label:'Task Pipeline', c:'#06B6D4',bg:'rgba(6,182,212,.1)', b:'rgba(6,182,212,.2)' },
          { href:'/clients', label:'Clients',       c:'#F59E0B',bg:'rgba(245,158,11,.1)',b:'rgba(245,158,11,.2)' },
          ...(isOwner?[{ href:'/cashflow',label:'Cashflow',c:'#10B981',bg:'rgba(16,185,129,.1)',b:'rgba(16,185,129,.2)' }]:[]),
        ].map(({href,label,c,bg,b})=>(
          <Link key={href} href={href} style={{ display:'flex',alignItems:'center',gap:8,padding:'0 12px',minHeight:48,background:'#1A1030',border:'1px solid #2D1F4E',borderRadius:12,textDecoration:'none' }}>
            <div style={{ width:26,height:26,borderRadius:7,background:bg,border:`1px solid ${b}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><div style={{ width:8,height:8,borderRadius:'50%',background:c }}/></div>
            <span style={{ fontSize:12,color:'#D1D5DB',fontWeight:500 }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
