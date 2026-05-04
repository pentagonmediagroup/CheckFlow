'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Clock, MapPin, User, CreditCard, Package, DollarSign } from 'lucide-react'

const PAY_STATUSES = ['Paid in Full','Deposit Paid','Unpaid','Refunded','Rescheduled','Late Fee Applied','Cancelled']
const PAY_COLOR: Record<string, string> = {
  'Paid in Full': '#34D399','Deposit Paid': '#FCD34D','Unpaid': '#F87171',
  'Late Fee Applied': '#FB923C','Cancelled': '#6B7280','Rescheduled': '#60A5FA','Refunded': '#A78BFA',
}

export default function SessionPage() {
  const { id } = useParams()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    const load = async () => {
      const [{ data: s }, { data: st }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).single(),
        supabase.from('staff').select('id,name').order('name'),
      ])
      setSession(s)
      setEditData(s || {})
      setStaff(st || [])
      setLoading(false)
    }
    load()
  }, [id])

  const save = async () => {
    setSaving(true)
    await supabase.from('sessions').update({
      payment_status: editData.payment_status,
      amount_owed: editData.amount_owed,
      amount_paid: editData.amount_paid,
      late_fee: editData.late_fee,
      reschedule_date: editData.reschedule_date || null,
      notes: editData.notes,
    }).eq('id', id as string)
    setSession({ ...session, ...editData })
    setEditing(false)
    setSaving(false)
  }

  const quickUpdate = async (patch: any) => {
    await supabase.from('sessions').update(patch).eq('id', id as string)
    setSession((s: any) => ({ ...s, ...patch }))
    setEditData((s: any) => ({ ...s, ...patch }))
  }

  if (loading) return <div style={{ padding: 40, color: '#4B5563' }}>Loading…</div>
  if (!session) return <div style={{ padding: 40, color: '#4B5563' }}>Session not found. <Link href="/dashboard" style={{ color: '#A78BFA' }}>← Back</Link></div>

  const balance = (session.amount_owed || 0) - (session.amount_paid || 0) + (session.late_fee || 0)
  const staffNames = (slot: string) => {
    const id = session[slot]
    return staff.find(s => s.id === id)?.name || null
  }

  const ed = (k: string, v: any) => setEditData((d: any) => ({ ...d, [k]: v }))

  return (
    <div style={{ padding: '32px 24px', maxWidth: 720 }}>
      <Link href="/calendar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', textDecoration: 'none', marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to Calendar
      </Link>

      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', display: 'inline-block', marginBottom: 4 }}>SESSION</span>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8ECF4' }}>{session.client_name}</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{session.session_type} · {session.studio}</p>
      </div>

      {/* Details card */}
      <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
        {[
          { Icon: Clock, label: 'Date & Time', value: `${session.date} at ${session.start_time?.slice(0,5)}` },
          { Icon: MapPin, label: 'Studio', value: session.studio },
          { Icon: User, label: 'Employee 1', value: staffNames('employee_1_id') },
          { Icon: User, label: 'Employee 2', value: staffNames('employee_2_id') },
          { Icon: User, label: 'Employee 3', value: staffNames('employee_3_id') },
          { Icon: Package, label: 'Deliverables', value: session.deliverables?.join(', ') || null },
        ].filter(r => r.value).map(({ Icon, label, value }, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid #1A1F38' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0C0F1E', border: '1px solid #1A1F38', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={14} style={{ color: '#6B7280' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
              <div style={{ fontSize: 13, color: '#E8ECF4', fontWeight: 500, marginTop: 1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment card */}
      <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={15} style={{ color: '#EAB308' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E8ECF4' }}>Payment</span>
          </div>
          <button onClick={() => setEditing(e => !e)} style={{ padding: '5px 12px', background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Payment Status', key: 'payment_status', type: 'select' },
              { label: 'Amount Owed ($)', key: 'amount_owed', type: 'number' },
              { label: 'Amount Paid ($)', key: 'amount_paid', type: 'number' },
              { label: 'Late Fee ($)', key: 'late_fee', type: 'number' },
              { label: 'Reschedule Date', key: 'reschedule_date', type: 'date' },
            ].map(({ label, key, type }) => (
              <div key={key} className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</label>
                {type === 'select'
                  ? <select value={editData[key] || ''} onChange={e => ed(key, e.target.value)} style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#E8ECF4', outline: 'none', appearance: 'none' }}>
                      {PAY_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  : <input type={type} value={editData[key] || ''} onChange={e => ed(key, e.target.value)} style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#E8ECF4', outline: 'none' }} />
                }
              </div>
            ))}
            <button onClick={save} disabled={saving} style={{ padding: 12, background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              {saving ? 'Saving…' : '✓ Save Changes'}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'Owed', value: `$${(session.amount_owed || 0).toFixed(2)}`, color: '#F87171' },
                { label: 'Paid', value: `$${(session.amount_paid || 0).toFixed(2)}`, color: '#34D399' },
                { label: 'Balance', value: `$${balance.toFixed(2)}`, color: balance > 0 ? '#EAB308' : '#34D399' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Status</span>
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 600, background: `${PAY_COLOR[session.payment_status] || '#6B7280'}22`, color: PAY_COLOR[session.payment_status] || '#6B7280', border: `1px solid ${PAY_COLOR[session.payment_status] || '#6B7280'}44` }}>{session.payment_status}</span>
            </div>
            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {session.payment_status !== 'Paid in Full' && (
                <button onClick={() => quickUpdate({ payment_status: 'Paid in Full', amount_paid: session.amount_owed })}
                  style={{ flex: 1, padding: '10px 12px', background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ Mark Paid</button>
              )}
              <button onClick={() => quickUpdate({ payment_status: 'Rescheduled' })}
                style={{ flex: 1, padding: '10px 12px', background: 'rgba(96,165,250,0.12)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>↩ Reschedule</button>
              <button onClick={() => quickUpdate({ payment_status: 'Late Fee Applied', late_fee: 25 })}
                style={{ flex: 1, padding: '10px 12px', background: 'rgba(251,146,60,0.12)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Late Fee</button>
              <button onClick={() => { if (confirm('Cancel this session?')) quickUpdate({ payment_status: 'Cancelled' }) }}
                style={{ flex: 1, padding: '10px 12px', background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✕ Cancel</button>
            </div>
          </>
        )}
      </div>

      {session.notes && (
        <div style={{ background: '#1A1030', border: '1px solid #2D1F4E', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Notes</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>{session.notes}</div>
        </div>
      )}
    </div>
  )
}
