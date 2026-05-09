'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react'

const PAY_COLOR: Record<string,string> = {
  'Paid in Full':'#34D399','Deposit Paid':'#FCD34D','Balance Due':'#F87171',
  'Late Fee Applied':'#FB923C','Cancelled':'#6B7280','Rescheduled':'#60A5FA','Refunded':'#A78BFA',
}

export default function CashflowPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Owner-only guard
    if (user && user.role !== 'owner') { router.replace('/dashboard'); return }
    const load = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id,client_name,service,start_time,payment_status,total_amount,amount_paid,late_fee,salesperson:employees!sessions_salesperson_id_fkey(id,name)')
        .order('start_time', { ascending:false })
      const rows = data||[]
      setSessions(rows)
      // Commission rollup by salesperson (25% on Paid in Full)
      const map: Record<string,{name:string;sales:number;commission:number}> = {}
      rows.forEach((r:any) => {
        if (r.salesperson && r.payment_status==='Paid in Full') {
          const id = r.salesperson.id
          if (!map[id]) map[id]={name:r.salesperson.name,sales:0,commission:0}
          map[id].sales += r.amount_paid||0
          map[id].commission += (r.amount_paid||0)*0.25
        }
      })
      setCommissions(Object.values(map))
      setLoading(false)
    }
    load()
  },[user])

  if (user?.role!=='owner') return null

  const totalInvoiced = sessions.reduce((s,r)=>s+(r.total_amount||0),0)
  const totalPaid     = sessions.reduce((s,r)=>s+(r.amount_paid||0),0)
  const totalOwed     = sessions.reduce((s,r)=>s+Math.max(0,(r.total_amount||0)-(r.amount_paid||0)+(r.late_fee||0)),0)
  const totalLate     = sessions.reduce((s,r)=>s+(r.late_fee||0),0)

  return (
    <div className="page-pad">
      <div style={{ marginBottom:22 }}>
        <div className="page-badge" style={{ background:'rgba(16,185,129,.12)',color:'#34D399',border:'1px solid rgba(16,185,129,.25)' }}>CASHFLOW · OWNER ONLY</div>
        <h1 style={{ fontSize:24,fontWeight:700 }}>Financial Overview</h1>
        <p style={{ fontSize:13,color:'#6B7280',marginTop:2 }}>Revenue, collections & 25% commission tracking</p>
      </div>

      {/* KPIs */}
      <div className="g4" style={{ marginBottom:18 }}>
        {[
          { label:'Total Invoiced', value:`$${totalInvoiced.toFixed(2)}`, Icon:DollarSign, c:'#A78BFA', bg:'rgba(139,92,246,.12)', b:'rgba(139,92,246,.2)' },
          { label:'Collected',      value:`$${totalPaid.toFixed(2)}`,     Icon:TrendingUp, c:'#34D399', bg:'rgba(16,185,129,.12)', b:'rgba(16,185,129,.2)' },
          { label:'Outstanding',   value:`$${totalOwed.toFixed(2)}`,     Icon:AlertCircle,c:totalOwed>0?'#F87171':'#34D399', bg:'rgba(239,68,68,.1)', b:'rgba(239,68,68,.2)' },
          { label:'Late Fees',     value:`$${totalLate.toFixed(2)}`,     Icon:DollarSign, c:'#FB923C', bg:'rgba(251,146,60,.1)', b:'rgba(251,146,60,.2)' },
        ].map(({label,value,Icon,c,bg,b})=>(
          <div key={label} className="card" style={{ padding:14 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:bg,border:`1px solid ${b}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10 }}>
              <Icon size={14} style={{ color:c }}/>
            </div>
            <div style={{ fontSize:22,fontWeight:700,color:'#fff' }}>{loading?'…':value}</div>
            <div style={{ fontSize:11,color:'#4B5563',marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Commission table */}
      {commissions.length>0 && (
        <div className="card" style={{ overflow:'hidden',marginBottom:16 }}>
          <div style={{ padding:'11px 16px',borderBottom:'1px solid #2D1F4E',display:'flex',alignItems:'center',gap:8 }}>
            <Users size={13} style={{ color:'#EAB308' }}/>
            <span style={{ fontSize:13,fontWeight:600 }}>Sales Commissions</span>
            <span style={{ fontSize:11,color:'#6B7280' }}>25% of paid-in-full sessions</span>
          </div>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:'1px solid #1A1F38' }}>
              {['Salesperson','Total Sales','Commission Owed'].map(h=>(
                <th key={h} style={{ padding:'8px 16px',textAlign:'left',fontSize:10,color:'#4B5563',fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {commissions.map((c,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #1A1F38' }}>
                  <td style={{ padding:'12px 16px',fontSize:13,fontWeight:600 }}>{c.name}</td>
                  <td style={{ padding:'12px 16px',fontSize:13,color:'#34D399' }}>${c.sales.toFixed(2)}</td>
                  <td style={{ padding:'12px 16px',fontSize:14,fontWeight:700,color:'#EAB308' }}>${c.commission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sessions breakdown */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'11px 16px',borderBottom:'1px solid #2D1F4E' }}>
          <span style={{ fontSize:13,fontWeight:600 }}>All Sessions</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',minWidth:700 }}>
            <thead><tr style={{ borderBottom:'1px solid #1A1F38' }}>
              {['Client','Service','Date','Invoiced','Paid','Balance','Status'].map(h=>(
                <th key={h} style={{ padding:'8px 14px',textAlign:'left',fontSize:10,color:'#4B5563',fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sessions.length===0&&!loading&&<tr><td colSpan={7} style={{ padding:40,textAlign:'center',color:'#4B5563' }}>No sessions yet</td></tr>}
              {sessions.map(s=>{
                const balance = (s.total_amount||0)-(s.amount_paid||0)+(s.late_fee||0)
                const dateStr = s.start_time ? String(s.start_time).slice(0,10) : '—'
                return (
                  <tr key={s.id} style={{ borderBottom:'1px solid #1A1F38' }}>
                    <td style={{ padding:'11px 14px',fontSize:13,fontWeight:600 }}>{s.client_name||'—'}</td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'#6B7280' }}>{s.service||'—'}</td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'#6B7280',whiteSpace:'nowrap' }}>{dateStr}</td>
                    <td style={{ padding:'11px 14px',fontSize:13 }}>${(s.total_amount||0).toFixed(2)}</td>
                    <td style={{ padding:'11px 14px',fontSize:13,color:'#34D399' }}>${(s.amount_paid||0).toFixed(2)}</td>
                    <td style={{ padding:'11px 14px',fontSize:13,fontWeight:700,color:balance>0?'#F87171':'#34D399' }}>${balance.toFixed(2)}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:11,padding:'3px 8px',borderRadius:6,fontWeight:500,background:`${PAY_COLOR[s.payment_status]||'#6B7280'}22`,color:PAY_COLOR[s.payment_status]||'#6B7280',border:`1px solid ${PAY_COLOR[s.payment_status]||'#6B7280'}44`,whiteSpace:'nowrap' }}>{s.payment_status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
