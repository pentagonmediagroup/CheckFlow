'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Plus, X, Edit2, Check, KeyRound } from 'lucide-react'

const BUILTIN_ROLES = ['Sales','Editor','Executive Assistant','Camera Man','Lighting','Director','Creative Director','Marketing','Social Media','Interns','Owner']
const STATUS_OPTS = ['Available','In Session','Off Duty']
const SC: Record<string,any> = {
  'Available': { bg:'rgba(16,185,129,.12)',color:'#34D399',border:'rgba(16,185,129,.3)' },
  'In Session': { bg:'rgba(139,92,246,.15)',color:'#A78BFA',border:'rgba(139,92,246,.3)' },
  'Off Duty': { bg:'rgba(75,85,99,.2)',color:'#6B7280',border:'rgba(75,85,99,.3)' },
}

export default function StaffPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [employees, setEmployees] = useState<any[]>([])
  const [roles, setRoles] = useState<string[]>(BUILTIN_ROLES)
  const [showForm, setShowForm] = useState(false)
  const [editEmp, setEditEmp] = useState<any>(null)
  const [addingRole, setAddingRole] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [saving, setSaving] = useState(false)
  const blank = { name:'', role:'', status:'Available', phone:'', email:'', username:'', password_hash:'', app_role:'employee' }
  const [form, setForm] = useState<any>(blank)

  const load = async () => {
    const {data} = await supabase.from('employees').select('*').order('name')
    setEmployees(data||[])
  }
  useEffect(()=>{load()},[])

  const set = (k:string,v:string) => setForm((f:any)=>({...f,[k]:v}))

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload: any = {
      name: form.name.trim(), role: form.role,
      status: form.status, phone: form.phone, email: form.email,
      app_role: form.app_role,
    }
    if (form.username.trim()) payload.username = form.username.trim()
    if (form.password_hash.trim()) payload.password_hash = form.password_hash.trim()

    if (editEmp) {
      await supabase.from('employees').update(payload).eq('id', editEmp.id)
      // Update app_users if linked
      if (form.username.trim()) {
        await supabase.from('app_users').upsert({ username:form.username.trim(), password_hash:form.password_hash||editEmp.password_hash, role:form.app_role, employee_id:editEmp.id, is_active:true }, { onConflict:'username' })
      }
    } else {
      const {data:emp} = await supabase.from('employees').insert(payload).select('id').single()
      // Create app_users login if username provided
      if (form.username.trim() && emp?.id) {
        await supabase.from('app_users').insert({ username:form.username.trim(), password_hash:form.password_hash, role:form.app_role, employee_id:emp.id, is_active:true })
      }
    }
    setForm(blank); setShowForm(false); setEditEmp(null); setSaving(false); load()
  }

  const startEdit = (e:any) => {
    setForm({ name:e.name||'', role:e.role||'', status:e.status||'Available', phone:e.phone||'', email:e.email||'', username:e.username||'', password_hash:'', app_role:e.app_role||'employee' })
    setEditEmp(e); setShowForm(true)
  }

  const deleteEmp = async (emp:any) => {
    if (!isOwner) return
    if (!confirm(`Delete ${emp.name}? This will remove their login access.`)) return
    // Delete app_users entry
    if (emp.username) await supabase.from('app_users').delete().eq('username', emp.username)
    await supabase.from('employees').delete().eq('id', emp.id)
    load()
  }

  const updateStatus = async (id:string, status:string) => {
    await supabase.from('employees').update({ status }).eq('id',id)
    setEmployees(e=>e.map(x=>x.id===id?{...x,status}:x))
  }

  const addRole = () => {
    if (!newRole.trim()) return
    setRoles(r=>[...r,newRole.trim()])
    setNewRole(''); setAddingRole(false)
  }

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:12,padding:'11px 14px',fontSize:14,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }

  return (
    <div className="page-pad">
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(245,158,11,.08)',color:'#EAB308',border:'1px solid rgba(245,158,11,.2)' }}>STAFF</div>
          <h1 style={{ fontSize:24,fontWeight:700,color:'#E8ECF4' }}>Studio Staff</h1>
          <p style={{ fontSize:13,color:'#6B7280',marginTop:2 }}>{employees.length} team members</p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          {isOwner && <button onClick={()=>setAddingRole(true)} className="btn btn-ghost"><Plus size={13}/> Add Role</button>}
          <button onClick={()=>{setForm(blank);setEditEmp(null);setShowForm(true)}} className="btn btn-primary"><Plus size={13}/> New Employee</button>
        </div>
      </div>

      {/* Add Role modal */}
      {addingRole && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:400 }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308',marginBottom:14 }}>Add New Role</h3>
            <label className="label">Role Name</label>
            <input style={inp} placeholder="e.g. Videographer" value={newRole} onChange={e=>setNewRole(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addRole()} autoFocus/>
            <div style={{ display:'flex',gap:8,marginTop:14 }}>
              <button onClick={addRole} className="btn btn-primary" style={{ flex:1 }}>Save Role</button>
              <button onClick={()=>setAddingRole(false)} className="btn btn-ghost">Cancel</button>
            </div>
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:11,color:'#4B5563',marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em' }}>Current Roles</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                {roles.map(r=><span key={r} style={{ padding:'3px 10px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:20,fontSize:12 }}>{r}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee form */}
      {showForm && (
        <div className="card" style={{ padding:20,marginBottom:18 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308' }}>{editEmp?'Edit Employee':'New Employee'}</h3>
            <button onClick={()=>{setShowForm(false);setEditEmp(null)}} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
          </div>
          <div className="g2">
            <div><label className="label">Full Name *</label><input style={inp} placeholder="Full name" value={form.name} onChange={e=>set('name',e.target.value)} autoFocus/></div>
            <div><label className="label">Role</label>
              <select style={inp} value={form.role} onChange={e=>set('role',e.target.value)}>
                <option value="">— Select Role —</option>
                {roles.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select style={inp} value={form.status} onChange={e=>set('status',e.target.value)}>
                {STATUS_OPTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">App Role</label>
              <select style={inp} value={form.app_role} onChange={e=>set('app_role',e.target.value)}>
                <option value="employee">Employee</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div><label className="label">Phone</label><input style={inp} placeholder="404-000-0000" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
            <div><label className="label">Email</label><input style={inp} placeholder="email@example.com" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
          </div>
          <div style={{ marginTop:14,padding:'14px 16px',background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.15)',borderRadius:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:10 }}><KeyRound size={13} style={{ color:'#A78BFA' }}/><span style={{ fontSize:12,fontWeight:600,color:'#A78BFA' }}>Login Credentials</span></div>
            <div className="g2">
              <div><label className="label">Username</label><input style={inp} placeholder="username" value={form.username} onChange={e=>set('username',e.target.value)}/></div>
              <div><label className="label">{editEmp?'New Password (leave blank = no change)':'Password'}</label><input style={inp} type="password" placeholder="password" value={form.password_hash} onChange={e=>set('password_hash',e.target.value)}/></div>
            </div>
          </div>
          <div style={{ display:'flex',gap:8,marginTop:16 }}>
            <button onClick={save} disabled={saving||!form.name.trim()} className="btn btn-primary">
              {saving?'Saving…':editEmp?'✓ Update':'+ Save Employee'}
            </button>
            <button onClick={()=>{setShowForm(false);setEditEmp(null)}} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Staff grid */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:12 }}>
        {employees.map(e=>{
          const st = SC[e.status]||SC['Off Duty']
          return (
            <div key={e.id} className="card" style={{ padding:18 }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ width:42,height:42,borderRadius:10,background:'linear-gradient(135deg,#6D28D9,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#EAB308',flexShrink:0 }}>
                    {e.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:14,fontWeight:600 }}>{e.name}</div>
                    <div style={{ fontSize:11,color:'#6B7280',marginTop:1 }}>{e.role||'No role'}</div>
                    {e.username && <div style={{ fontSize:10,color:'#4B5563',marginTop:1 }}>@{e.username}</div>}
                  </div>
                </div>
                <div style={{ display:'flex',gap:4 }}>
                  <button onClick={()=>startEdit(e)} style={{ width:28,height:28,background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.2)',borderRadius:6,color:'#A78BFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Edit2 size={12}/></button>
                  {isOwner && <button onClick={()=>deleteEmp(e)} style={{ width:28,height:28,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={12}/></button>}
                </div>
              </div>
              <select value={e.status} onChange={ev=>updateStatus(e.id,ev.target.value)}
                style={{ width:'100%',padding:'7px 10px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',background:st.bg,color:st.color,border:`1px solid ${st.border}`,outline:'none',appearance:'none',marginBottom:8 }}>
                {STATUS_OPTS.map(s=><option key={s} value={s} style={{ background:'#0F0A1E',color:'#E8ECF4' }}>{s}</option>)}
              </select>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:8 }}>
                <span style={{ fontSize:11,color:'#6B7280' }}>App Role</span>
                <span style={{ fontSize:11,fontWeight:600,color:e.app_role==='owner'?'#EAB308':'#9CA3AF' }}>{e.app_role||'employee'}</span>
              </div>
            </div>
          )
        })}
        {employees.length===0 && <div style={{ gridColumn:'1/-1',textAlign:'center',padding:'60px 0',color:'#4B5563' }}>No staff yet — add one above.</div>}
      </div>
    </div>
  )
}
