'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { useAuth } from '@/components/AuthProvider'
import { Plus, X, Edit2, KeyRound } from 'lucide-react'

const BUILTIN_ROLES = ['Sales','Editor','Executive Assistant','Camera Man','Lighting','Director','Creative Director','Marketing','Social Media','Interns','Owner','Sound Engineer','Producer']
const STUDIOS = ['Studio A','Studio B','Both','N/A']

export default function StaffPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [employees, setEmployees] = useState<any[]>([])
  const [extraRoles, setExtraRoles] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editEmp, setEditEmp] = useState<any>(null)
  const [addingRole, setAddingRole] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const blank = { name:'', role:'', available:true, studio:'Studio A', phone:'', email:'', username:'', password:'', app_role:'employee' }
  const [form, setForm] = useState<any>(blank)
  const allRoles = [...BUILTIN_ROLES, ...extraRoles]

  const load = async () => {
    const [{ data, error }, { data: onlineUsers }] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('app_users').select('username,employee_id,last_seen').eq('is_active', true),
    ])
    if (error) console.error('employees load:', error.message)
    // Mark employees as online if their last_seen is within 30 minutes
    const now = Date.now()
    const onlineIds = new Set(
      (onlineUsers || [])
        .filter((u: any) => u.last_seen && (now - new Date(u.last_seen).getTime()) < 30 * 60 * 1000)
        .map((u: any) => u.employee_id)
        .filter(Boolean)
    )
    const enriched = (data || []).map((e: any) => ({ ...e, _online: onlineIds.has(e.id) }))
    setEmployees(enriched)
  }
  useEffect(() => { load() }, [])

  const f = (k: string, v: any) => setForm((x: any) => ({ ...x, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) return
    setErr(''); setSaving(true)
    const payload: any = {
      name: form.name.trim(),
      role: form.role || null,
      available: Boolean(form.available),
      studio: form.studio || 'N/A',
      phone: form.phone || null,
      email: form.email || null,
      app_role: form.app_role || 'employee',
    }
    if (form.username.trim()) payload.username = form.username.trim().toLowerCase()
    if (form.password.trim()) payload.password_hash = form.password.trim()

    let empId = editEmp?.id || null
    if (editEmp) {
      const { error } = await supabase.from('employees').update(payload).eq('id', editEmp.id)
      if (error) { setErr(error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('employees').insert(payload).select('id').single()
      if (error) { setErr(error.message); setSaving(false); return }
      empId = data?.id
    }

    // Upsert app_users login
    if (form.username.trim()) {
      const loginPayload: any = { username: form.username.trim().toLowerCase(), role: form.app_role || 'employee', employee_id: empId, is_active: true }
      if (form.password.trim()) loginPayload.password_hash = form.password.trim()
      const { error: auErr } = await supabase.from('app_users').upsert(loginPayload, { onConflict: 'username' })
      if (auErr) console.error('app_users error:', auErr.message)
    }

    await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:editEmp?'UPDATE':'CREATE', category:'staff', target_type:'employee', target_name:form.name.trim(), detail:`${editEmp?'Updated':'Created'} employee ${form.name.trim()} (${form.role||'no role'})` })
    setForm(blank); setShowForm(false); setEditEmp(null); setSaving(false); load()
  }

  const startEdit = (e: any) => {
    setForm({ name:e.name||'', role:e.role||'', available:e.available??true, studio:e.studio||'Studio A', phone:e.phone||'', email:e.email||'', username:e.username||'', password:'', app_role:e.app_role||'employee' })
    setEditEmp(e); setShowForm(true); setErr('')
  }

  const deleteEmp = async (emp: any) => {
    if (!isOwner) return
    if (!confirm(`Delete ${emp.name}? Their login will be removed too.`)) return
    if (emp.username) await supabase.from('app_users').delete().eq('username', emp.username)
    await supabase.from('employees').delete().eq('id', emp.id)
    await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'DELETE', category:'staff', target_type:'employee', target_name:emp.name, detail:`Deleted employee ${emp.name} and removed login access` })
    load()
  }

  const toggleAvail = async (id: string, cur: boolean) => {
    await supabase.from('employees').update({ available: !cur }).eq('id', id)
    setEmployees(e => e.map(x => x.id === id ? { ...x, available: !cur } : x))
  }

  const inp = { background:'#0F0A1E', border:'1px solid #2D1F4E', borderRadius:12, padding:'11px 14px', fontSize:14, color:'#E8ECF4', width:'100%', outline:'none', fontFamily:'inherit' }

  return (
    <div className="page-pad">
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(245,158,11,.08)',color:'#EAB308',border:'1px solid rgba(245,158,11,.2)' }}>STAFF</div>
          <h1 style={{ fontSize:24,fontWeight:700 }}>Studio Staff</h1>
          <p style={{ fontSize:13,color:'#6B7280',marginTop:2 }}>{employees.length} team members</p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          {isOwner && <button onClick={() => setAddingRole(true)} className="btn btn-ghost"><Plus size={13}/> Add Role</button>}
          <button onClick={() => { setForm(blank); setEditEmp(null); setShowForm(true); setErr('') }} className="btn btn-primary"><Plus size={13}/> New Employee</button>
        </div>
      </div>

      {addingRole && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
          <div className="card" style={{ padding:24,width:'100%',maxWidth:420 }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308',marginBottom:14 }}>Add New Role</h3>
            <label className="label">Role Name</label>
            <input style={inp} placeholder="e.g. Videographer" value={newRole} onChange={e => setNewRole(e.target.value)} onKeyDown={e => e.key==='Enter' && (() => { if (newRole.trim()) { setExtraRoles(r=>[...r,newRole.trim()]); setNewRole(''); setAddingRole(false) } })()} autoFocus/>
            <div style={{ display:'flex',gap:8,marginTop:14 }}>
              <button onClick={() => { if (newRole.trim()) { setExtraRoles(r=>[...r,newRole.trim()]); setNewRole(''); setAddingRole(false) } }} className="btn btn-primary" style={{ flex:1 }}>Save Role</button>
              <button onClick={() => setAddingRole(false)} className="btn btn-ghost">Cancel</button>
            </div>
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:11,color:'#4B5563',marginBottom:6,textTransform:'uppercase',letterSpacing:'.08em' }}>All Roles</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                {allRoles.map(r => <span key={r} style={{ padding:'3px 10px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.2)',borderRadius:20,fontSize:12 }}>{r}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ padding:20,marginBottom:18 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308' }}>{editEmp ? 'Edit Employee' : 'New Employee'}</h3>
            <button onClick={() => { setShowForm(false); setEditEmp(null) }} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
          </div>
          {err && <div style={{ marginBottom:12,padding:'8px 12px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,color:'#F87171',fontSize:13 }}>{err}</div>}
          <div className="g2">
            <div><label className="label">Full Name *</label><input style={inp} placeholder="Full name" value={form.name} onChange={e => f('name',e.target.value)} autoFocus/></div>
            <div><label className="label">Role</label>
              <select style={inp} value={form.role} onChange={e => f('role',e.target.value)}>
                <option value="">— Select Role —</option>
                {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label">Studio</label>
              <select style={inp} value={form.studio} onChange={e => f('studio',e.target.value)}>
                {STUDIOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Access Level</label>
              <select style={inp} value={form.app_role} onChange={e => f('app_role',e.target.value)}>
                <option value="employee">Employee (limited)</option>
                <option value="owner">Owner (full access)</option>
              </select>
            </div>
            <div><label className="label">Phone</label><input style={inp} placeholder="404-000-0000" value={form.phone} onChange={e => f('phone',e.target.value)}/></div>
            <div><label className="label">Email</label><input style={inp} placeholder="email@example.com" value={form.email} onChange={e => f('email',e.target.value)}/></div>
          </div>

          <div style={{ marginTop:16,padding:'14px 16px',background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.15)',borderRadius:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:12 }}>
              <KeyRound size={13} style={{ color:'#A78BFA' }}/>
              <span style={{ fontSize:13,fontWeight:600,color:'#A78BFA' }}>Login Credentials</span>
            </div>
            <div className="g2">
              <div><label className="label">Username</label><input style={inp} placeholder="e.g. mbowden" value={form.username} onChange={e => f('username',e.target.value.toLowerCase())}/></div>
              <div><label className="label">{editEmp?'New Password (blank = no change)':'Password'}</label><input style={inp} type="password" placeholder="password" value={form.password} onChange={e => f('password',e.target.value)}/></div>
            </div>
          </div>

          <div style={{ display:'flex',gap:8,marginTop:16 }}>
            <button onClick={save} disabled={saving||!form.name.trim()} className="btn btn-primary" style={{ flex:1,minHeight:44 }}>
              {saving ? 'Saving…' : editEmp ? '✓ Update' : '+ Save Employee'}
            </button>
            <button onClick={() => { setShowForm(false); setEditEmp(null) }} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:12 }}>
        {employees.map(e => {
          const avail = e.available !== false
          return (
            <div key={e.id} className="card" style={{ padding:18 }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ width:44,height:44,borderRadius:10,background:'linear-gradient(135deg,#6D28D9,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:700,color:'#EAB308',flexShrink:0 }}>
                    {e.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:14,fontWeight:600 }}>{e.name}</div>
                    <div style={{ fontSize:11,color:'#6B7280',marginTop:1 }}>{e.role||'No role'}</div>
                    {e.username && <div style={{ fontSize:10,color:'#4B5563',fontFamily:'monospace',marginTop:1 }}>@{e.username}</div>}
                  </div>
                </div>
                <div style={{ display:'flex',gap:4 }}>
                  <button onClick={() => startEdit(e)} style={{ width:28,height:28,background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.2)',borderRadius:6,color:'#A78BFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Edit2 size={12}/></button>
                  {isOwner && <button onClick={() => deleteEmp(e)} style={{ width:28,height:28,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={12}/></button>}
                </div>
              </div>
              {/* Online = signed in within 30 min; Available = manually set */}
              <div style={{ display:'flex',gap:6,marginBottom:8 }}>
                <div style={{ flex:1,padding:'6px 8px',borderRadius:8,fontSize:11,fontWeight:600,textAlign:'center',
                  background: e._online?'rgba(16,185,129,.12)':'rgba(75,85,99,.15)',
                  color: e._online?'#34D399':'#4B5563',
                  border: `1px solid ${e._online?'rgba(16,185,129,.3)':'rgba(75,85,99,.25)'}` }}>
                  {e._online ? '● Online' : '○ Offline'}
                </div>
                <button onClick={() => toggleAvail(e.id, avail)}
                  style={{ flex:1,padding:'6px 8px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:'1px solid',
                    background: avail?'rgba(139,92,246,.12)':'rgba(75,85,99,.15)',
                    color: avail?'#A78BFA':'#4B5563',
                    borderColor: avail?'rgba(139,92,246,.3)':'rgba(75,85,99,.25)' }}>
                  {avail ? '✓ Available' : '○ Unavailable'}
                </button>
              </div>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:8 }}>
                <span style={{ fontSize:11,color:'#6B7280' }}>Access</span>
                <span style={{ fontSize:11,fontWeight:700,color:e.app_role==='owner'?'#EAB308':'#9CA3AF' }}>{(e.app_role||'employee').toUpperCase()}</span>
              </div>
            </div>
          )
        })}
        {employees.length===0 && <div style={{ gridColumn:'1/-1',textAlign:'center',padding:'60px 0',color:'#4B5563' }}>No staff yet. Click "+ New Employee".</div>}
      </div>
    </div>
  )
}
