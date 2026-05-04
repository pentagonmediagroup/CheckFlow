'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SERVICES = ['Recording Session','Mixing','Mastering','Vocal Booth','Band Rehearsal','Podcast','Photography','Video Production']
const DEADLINES = ['24-48 hrs','3-5 days','1 week','2 weeks','Custom']
const PAY_STATUSES = ['Paid in Full','Deposit Paid','Unpaid','Refunded','Rescheduled','Late Fee Applied','Cancelled']
const DELIVERABLES = ['Full Video','Audio Bounce','Thumbnail','Social Clips','Other']

export default function BookPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    client_name: '', phone: '', email: '', instagram: '',
    studio: 'Studio A', session_type: 'Recording Session',
    date: '', start_time: '', duration_minutes: 60,
    employee_1_id: '', employee_2_id: '', employee_3_id: '',
    deliverables: [] as string[], deadline: '24-48 hrs',
    payment_status: 'Unpaid', amount_owed: '', amount_paid: '',
    late_fee: '', reschedule_date: '',
    salesperson_id: '', notes: '',
  })

  useEffect(() => {
    supabase.from('staff').select('id,name,role_id,roles(name)').then(({ data }) => setStaff(data || []))
    supabase.from('clients').select('id,name').order('name').then(({ data }) => setClients(data || []))
  }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleDeliverable = (d: string) => {
    set('deliverables', form.deliverables.includes(d)
      ? form.deliverables.filter(x => x !== d)
      : [...form.deliverables, d])
  }

  const handleSubmit = async () => {
    if (!form.client_name || !form.date || !form.start_time) return
    setSaving(true)
    try {
      // upsert client
      let clientId: string | null = null
      const existingClient = clients.find(c => c.name.toLowerCase() === form.client_name.toLowerCase())
      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data } = await supabase.from('clients').insert({
          name: form.client_name, phone: form.phone, email: form.email,
          instagram: form.instagram, salesperson_id: form.salesperson_id || null,
        }).select('id').single()
        clientId = data?.id || null
      }

      // create session
      const { data: session, error } = await supabase.from('sessions').insert({
        client_id: clientId,
        client_name: form.client_name,
        session_type: form.session_type,
        studio: form.studio,
        date: form.date,
        start_time: form.start_time,
        duration_minutes: form.duration_minutes,
        employee_1_id: form.employee_1_id || null,
        employee_2_id: form.employee_2_id || null,
        employee_3_id: form.employee_3_id || null,
        deliverables: form.deliverables,
        deadline: form.deadline,
        payment_status: form.payment_status,
        amount_owed: parseFloat(form.amount_owed) || 0,
        amount_paid: parseFloat(form.amount_paid) || 0,
        late_fee: parseFloat(form.late_fee) || 0,
        reschedule_date: form.reschedule_date || null,
        salesperson_id: form.salesperson_id || null,
        notes: form.notes,
      }).select('id').single()

      if (error) throw error

      // auto-create tasks pipeline
      if (session?.id) {
        await supabase.from('tasks').insert({
          session_id: session.id,
          client_name: form.client_name,
          task_type: form.session_type,
          stage: 'Setup',
          pipeline_name: 'Default',
        })
      }

      setSaved(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (saved) return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4' }}>Session Booked!</h2>
      <p style={{ color: '#6B7280', marginTop: 6 }}>Saved to Supabase. Redirecting…</p>
    </div>
  )

  const inputStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#E8ECF4', width: '100%', outline: 'none', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 500, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.04em' }

  return (
    <div className="p-8-page" style={{ padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Book a Session</h1>
        <p style={{ color: '#9CA3AF', marginTop: 4 }}>Schedule Studio A or Studio B</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Client Information */}
        <div className="section-card">
          <div className="section-title">Client Information</div>
          <div className="grid-2">
            <div>
              <label style={labelStyle}>Client Name *</label>
              <input style={inputStyle} placeholder="Full name" value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
                list="client-suggestions" />
              <datalist id="client-suggestions">
                {clients.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} placeholder="404-555-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" placeholder="client@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Instagram Handle</label>
              <input style={inputStyle} placeholder="@handle" value={form.instagram} onChange={e => set('instagram', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="section-card">
          <div className="section-title">Session Details</div>
          <div className="grid-2">
            <div>
              <label style={labelStyle}>Studio *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['Studio A', 'Studio B'].map(s => (
                  <button key={s} type="button" onClick={() => set('studio', s)}
                    style={{ padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all .15s',
                      background: form.studio === s ? 'linear-gradient(135deg,#6B21A8,#4C1D95)' : '#0F0A1E',
                      color: form.studio === s ? '#EAB308' : '#9CA3AF',
                      borderColor: form.studio === s ? '#6B21A8' : '#2D1F4E' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Service *</label>
              <select style={inputStyle} value={form.session_type} onChange={e => set('session_type', e.target.value)}>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date *</label>
              <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Start Time *</label>
              <input style={inputStyle} type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <select style={inputStyle} value={form.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value))}>
                {[30,60,90,120,180,240,300,360].map(m => <option key={m} value={m}>{m < 60 ? `${m}m` : `${m/60}h`}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigned Employee 1</label>
              <select style={inputStyle} value={form.employee_1_id} onChange={e => set('employee_1_id', e.target.value)}>
                <option value="">— Select —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}{s.roles?.name ? ` · ${s.roles.name}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigned Employee 2</label>
              <select style={inputStyle} value={form.employee_2_id} onChange={e => set('employee_2_id', e.target.value)}>
                <option value="">— Select —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}{s.roles?.name ? ` · ${s.roles.name}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigned Employee 3</label>
              <select style={inputStyle} value={form.employee_3_id} onChange={e => set('employee_3_id', e.target.value)}>
                <option value="">— Select —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}{s.roles?.name ? ` · ${s.roles.name}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Salesperson (for commission)</label>
              <select style={inputStyle} value={form.salesperson_id} onChange={e => set('salesperson_id', e.target.value)}>
                <option value="">— Select —</option>
                {staff.filter(s => s.roles?.name === 'Sales' || !s.roles?.name).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="section-card">
          <div className="section-title">Deliverables</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {DELIVERABLES.map(d => (
              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '12px', borderRadius: 10, background: '#0F0A1E', border: `1px solid ${form.deliverables.includes(d) ? '#6B21A8' : '#2D1F4E'}`, transition: 'border .15s' }}>
                <input type="checkbox" checked={form.deliverables.includes(d)} onChange={() => toggleDeliverable(d)}
                  style={{ width: 16, height: 16, accentColor: '#8B5CF6', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: '#fff' }}>{d}</span>
              </label>
            ))}
          </div>
          <div className="grid-2">
            <div>
              <label style={labelStyle}>Deadline</label>
              <select style={inputStyle} value={form.deadline} onChange={e => set('deadline', e.target.value)}>
                {DEADLINES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Payment Status</label>
              <select style={inputStyle} value={form.payment_status} onChange={e => set('payment_status', e.target.value)}>
                {PAY_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount Owed ($)</label>
              <input style={inputStyle} type="number" placeholder="0.00" value={form.amount_owed} onChange={e => set('amount_owed', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Amount Paid ($)</label>
              <input style={inputStyle} type="number" placeholder="0.00" value={form.amount_paid} onChange={e => set('amount_paid', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Late Fee ($)</label>
              <input style={inputStyle} type="number" placeholder="0.00" value={form.late_fee} onChange={e => set('late_fee', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Reschedule Date</label>
              <input style={inputStyle} type="date" value={form.reschedule_date} onChange={e => set('reschedule_date', e.target.value)} />
            </div>
          </div>

          {/* Payment balance summary */}
          {(form.amount_owed || form.amount_paid) && (
            <div style={{ marginTop: 16, padding: '14px 16px', background: '#0F0A1E', border: '1px solid #2D1F4E', borderRadius: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.08em' }}>Owed</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#F87171' }}>${parseFloat(form.amount_owed||'0').toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.08em' }}>Paid</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#34D399' }}>${parseFloat(form.amount_paid||'0').toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.08em' }}>Balance</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#EAB308' }}>
                  ${(parseFloat(form.amount_owed||'0') - parseFloat(form.amount_paid||'0') + parseFloat(form.late_fee||'0')).toFixed(2)}
                </div>
              </div>
              {form.late_fee && parseFloat(form.late_fee) > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.08em' }}>Late Fee</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#FB923C' }}>${parseFloat(form.late_fee).toFixed(2)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="section-card">
          <label style={labelStyle}>Notes</label>
          <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Any additional notes for this session..."
            value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full"
          style={{ width: '100%', padding: 16, fontSize: 16, background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: 'none', borderRadius: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 0 30px rgba(107,33,168,0.4)', opacity: saving ? .7 : 1 }}>
          {saving ? 'Booking…' : '⚡ Book Session'}
        </button>
      </div>
    </div>
  )
}
