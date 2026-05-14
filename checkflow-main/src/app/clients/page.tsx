'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { logAudit } from '@/lib/audit'
import { Plus, X, Edit2, EyeOff } from 'lucide-react'

const CLIENT_TYPES = ['Artist','Band','DJ/Producer','Podcast','Corporate','Solo','Other']

export default function ClientsPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [clients, setClients]     = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<string|null>(null)
  const [saving, setSaving]       = useState(false)
  const [showDisabled, setShowDisabled] = useState(false)
  const blank = { name:'', type:'', phone:'', email:'', ig:'', salesperson_id:'', notes:'' }
  const [form, setForm] = useState<any>(blank)

  const load = async () => {
    const [{ data:c },{ data:e }] = await Promise.all([
      supabase.from('clients').select('*,salesperson:employees!clients_salesperson_id_fkey(id,name)').order('name'),
      supabase.from('employees').select('id,name,role').order('name'),
    ])
    setClients(c||[])
    setEmployees(e||[])
  }
  useEffect(() => { load() }, [])

  const set = (k:string,v:string) => setForm((f:any)=>({...f,[k]:v}))

  const save = async () => {
    if (!form.name.trim()) return alert('Client name required')
    setSaving(true)
    const payload = { name:form.name.trim(), type:form.type||null, phone:form.phone||null, email:form.email||null, ig:form.ig||null, salesperson_id:form.salesperson_id||null, notes:form.notes||null }
    let err
    if (editId) { const r=await supabase.from('clients').update(payload).eq('id',editId); err=r.error }
    else        { const r=await supabase.from('clients').insert(payload); err=r.error }
    if (err) { alert('Error: '+err.message); setSaving(false); return }
    await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:editId?'UPDATE':'CREATE', category:'client', target_name:form.name.trim(), detail:`${editId?'Updated':'Created'} client ${form.name.trim()}` })
    setForm(blank); setShowForm(false); setEditId(null); setSaving(false); load()
  }

  const startEdit = (c:any) => {
    setForm({ name:c.name||'', type:c.type||'', phone:c.phone||'', email:c.email||'', ig:c.ig||'', salesperson_id:c.salesperson_id||'', notes:c.notes||'' })
    setEditId(c.id); setShowForm(true)
  }

  const del = async (id:string) => {
    if (!isOwner) return
    if (!confirm('Permanently delete client?')) return
    const c = clients.find(x=>x.id===id)
    await supabase.from('clients').delete().eq('id',id)
    await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'DELETE', category:'client', target_name:c?.name||id, detail:`Deleted client ${c?.name}` })
    setClients(c=>c.filter(x=>x.id!==id))
  }

  const toggleDisable = async (c:any) => {
    const newVal = !c.disabled
    await supabase.from('clients').update({ disabled:newVal }).eq('id',c.id)
    await logAudit({ actor_username:user?.username||'system', actor_role:user?.role, action:'UPDATE', category:'client', target_name:c.name, detail:`${newVal?'Disabled':'Enabled'} client ${c.name}` })
    setClients(cl=>cl.map(x=>x.id===c.id?{...x,disabled:newVal}:x))
  }

  const inp = { background:'#0F0A1E',border:'1px solid #2D1F4E',borderRadius:12,padding:'11px 14px',fontSize:14,color:'#E8ECF4',width:'100%',outline:'none',fontFamily:'inherit' }

  const visible = clients.filter(c => showDisabled || !c.disabled)

  return (
    <div className="page-pad">
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="page-badge" style={{ background:'rgba(245,158,11,.08)',color:'#EAB308',border:'1px solid rgba(245,158,11,.2)' }}>CLIENTS</div>
          <h1 style={{ fontSize:24,fontWeight:700 }}>Client Roster</h1>
          <p style={{ fontSize:13,color:'#6B7280',marginTop:2 }}>{visible.length} clients</p>
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <button onClick={()=>setShowDisabled(v=>!v)} style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 12px',background:showDisabled?'rgba(239,68,68,.08)':'rgba(75,85,99,.15)',color:showDisabled?'#F87171':'#6B7280',border:`1px solid ${showDisabled?'rgba(239,68,68,.2)':'#2D1F4E'}`,borderRadius:8,fontSize:12,cursor:'pointer' }}>
            <EyeOff size={13}/>{showDisabled?'Hide Disabled':'Show Disabled'}
          </button>
          <button onClick={()=>{setForm(blank);setEditId(null);setShowForm(true)}} className="btn btn-primary"><Plus size={13}/> New Client</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding:20,marginBottom:18 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#EAB308' }}>{editId?'Edit Client':'New Client'}</h3>
            <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer' }}><X size={18}/></button>
          </div>
          <div className="g2">
            <div><label className="label">Client Name *</label><input style={inp} placeholder="Full name" value={form.name} onChange={e=>set('name',e.target.value)} autoFocus/></div>
            <div><label className="label">Type</label>
              <select style={inp} value={form.type} onChange={e=>set('type',e.target.value)}>
                <option value="">— Select —</option>
                {CLIENT_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Phone</label><input style={inp} placeholder="404-000-0000" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
            <div><label className="label">Email</label><input style={inp} type="email" placeholder="email@example.com" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
            <div><label className="label">Instagram</label><input style={inp} placeholder="@handle" value={form.ig} onChange={e=>set('ig',e.target.value)}/></div>
            <div>
              <label className="label">Salesperson <span style={{ color:'#6B7280',fontSize:10 }}>(25% commission on paid)</span></label>
              <select style={inp} value={form.salesperson_id} onChange={e=>set('salesperson_id',e.target.value)}>
                <option value="">— None —</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.name}{e.role?` · ${e.role}`:''}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}><label className="label">Notes</label><textarea style={{ ...inp,resize:'vertical' as any }} rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}/></div>
          </div>
          <div style={{ display:'flex',gap:8,marginTop:14 }}>
            <button onClick={save} disabled={saving||!form.name.trim()} className="btn btn-primary">{saving?'Saving…':editId?'✓ Update Client':'+ Save Client'}</button>
            <button onClick={()=>{setShowForm(false);setEditId(null)}} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #2D1F4E' }}>
              {['Client','Type','Contact','Salesperson',''].map(h=>(
                <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:10,color:'#4B5563',fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(c=>(
              <tr key={c.id} style={{ borderBottom:'1px solid #1A1F38',opacity:c.disabled?.5:1 }}>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#6D28D9,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#EAB308',flexShrink:0 }}>{c.name?.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6 }}>
                        {c.name}
                        {c.disabled&&<span style={{ fontSize:9,padding:'1px 5px',background:'rgba(239,68,68,.1)',color:'#F87171',border:'1px solid rgba(239,68,68,.2)',borderRadius:4 }}>DISABLED</span>}
                      </div>
                      {c.ig&&<div style={{ fontSize:10,color:'#6B7280' }}>{c.ig}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:'12px 14px',fontSize:12,color:'#6B7280' }}>{c.type||'—'}</td>
                <td style={{ padding:'12px 14px' }}>
                  {c.email&&<div style={{ fontSize:12,color:'#9CA3AF' }}>{c.email}</div>}
                  {c.phone&&<div style={{ fontSize:11,color:'#4B5563' }}>{c.phone}</div>}
                </td>
                <td style={{ padding:'12px 14px',fontSize:12,color:c.salesperson?'#A78BFA':'#4B5563' }}>{c.salesperson?.name||'—'}</td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex',gap:5 }}>
                    <button onClick={()=>startEdit(c)} style={{ width:30,height:30,background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.2)',borderRadius:6,color:'#A78BFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }} title="Edit"><Edit2 size={12}/></button>
                    <button onClick={()=>toggleDisable(c)} style={{ width:30,height:30,background:c.disabled?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)',border:`1px solid ${c.disabled?'rgba(16,185,129,.2)':'rgba(245,158,11,.2)'}`,borderRadius:6,color:c.disabled?'#34D399':'#F59E0B',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }} title={c.disabled?'Enable':'Disable'}>
                      <EyeOff size={12}/>
                    </button>
                    {isOwner&&<button onClick={()=>del(c.id)} style={{ width:30,height:30,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }} title="Delete"><X size={12}/></button>}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length===0&&<tr><td colSpan={5} style={{ padding:'48px',textAlign:'center',color:'#4B5563' }}>No clients yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
