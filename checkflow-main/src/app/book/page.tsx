'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { STUDIO_A_SERVICES, STUDIO_B_SERVICES, MOCK_EMPLOYEES, PAYMENT_STATUSES } from '@/lib/mockData'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { addMinutes } from 'date-fns'

type Employee = { id: string; name: string; role: string }

const inp = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
const inpStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E' }
const selStyle = { ...inpStyle, appearance: 'none' as const }

export default function BookPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)

  useEffect(() => {
    supabase.from('employees').select('id,name,role').order('name').then(({ data }) => {
      if (data?.length) setEmployees(data)
    })
  }, [])

  const [form, setForm] = useState({
    clientName: '', phone: '', email: '', ig: '',
    studio: 'Studio A', service: STUDIO_A_SERVICES[0],
    date: '', startTime: '', duration: 60,
    empIds: ['', '', ''] as string[],
    salespersonId: '',
    paymentStatus: 'Deposit Paid',
    totalAmount: '', amountPaid: '', lateFee: '0',
    notes: '',
    deadline: '24-48 hrs',
    deliverables: { fullVideo: false, socialClips: 0, audioBounce: false, thumbnail: false, other: false, otherNote: '' }
  })

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const setDel = (k: string, v: unknown) => setForm(p => ({ ...p, deliverables: { ...p.deliverables, [k]: v } }))
  const setEmp = (i: number, v: string) => setForm(p => { const a = [...p.empIds]; a[i] = v; return { ...p, empIds: a } })

  const services = form.studio === 'Studio A' ? STUDIO_A_SERVICES : STUDIO_B_SERVICES
  const balance = (parseFloat(form.totalAmount) || 0) + (parseFloat(form.lateFee) || 0) - (parseFloat(form.amountPaid) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const start = new Date(`${form.date}T${form.startTime}`)
      const end = addMinutes(start, form.duration)

      // Upsert client
      let clientId: string
      const { data: existingClients } = await supabase.from('clients').select('id').eq('name', form.clientName).limit(1)
      if (existingClients?.length) {
        clientId = existingClients[0].id
        await supabase.from('clients').update({ phone: form.phone, email: form.email || null, ig: form.ig, salesperson_id: form.salespersonId || null }).eq('id', clientId)
      } else {
        const { data: newClient, error: ce } = await supabase.from('clients')
          .insert({ name: form.clientName, phone: form.phone, email: form.email || null, ig: form.ig, salesperson_id: form.salespersonId || null })
          .select().single()
        if (ce) throw ce
        clientId = newClient.id
      }

      // Create session
      const { data: session, error: se } = await supabase.from('sessions').insert({
        client_id: clientId, studio: form.studio, service: form.service,
        start_time: start.toISOString(), end_time: end.toISOString(),
        payment_status: form.paymentStatus,
        total_amount: parseFloat(form.totalAmount) || 0,
        amount_paid: parseFloat(form.amountPaid) || 0,
        late_fee: parseFloat(form.lateFee) || 0,
        salesperson_id: form.salespersonId || null,
        notes: form.notes,
      }).select().single()
      if (se) throw se

      // Assign employees
      const assigned = form.empIds.filter(Boolean)
      if (assigned.length) {
        await supabase.from('session_employees').insert(assigned.map(eid => ({ session_id: session.id, employee_id: eid })))
      }

      // Deliverables
      const delivs = []
      if (form.deliverables.fullVideo) delivs.push({ session_id: session.id, type: 'Full Video', quantity: 1 })
      if (form.deliverables.socialClips > 0) delivs.push({ session_id: session.id, type: 'Social Clips', quantity: form.deliverables.socialClips })
      if (form.deliverables.audioBounce) delivs.push({ session_id: session.id, type: 'Audio Bounce', quantity: 1 })
      if (form.deliverables.thumbnail) delivs.push({ session_id: session.id, type: 'Thumbnail', quantity: 1 })
      if (form.deliverables.other) delivs.push({ session_id: session.id, type: form.deliverables.otherNote || 'Other', quantity: 1 })
      if (delivs.length) await supabase.from('deliverables').insert(delivs)

      // Calendar event + task
      await supabase.from('calendar_events').insert({ title: `${form.clientName} — ${form.service}`, start_time: start.toISOString(), end_time: end.toISOString(), studio: form.studio, event_type: 'General', session_id: session.id })
      await supabase.from('tasks').insert({ session_id: session.id, status: 'Setup', assigned_to: assigned[0] || null })

      setSuccess(true)
      setTimeout(() => router.push('/tasks'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <AppShell>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle size={56} className="mx-auto mb-4" style={{ color: '#22C55E' }} />
          <h2 className="font-display text-2xl font-bold text-white mb-2">Session Booked!</h2>
          <p className="text-gray-400 text-sm">Redirecting to task pipeline...</p>
        </div>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#2D1F4E', color: '#9CA3AF' }}>book</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }}>LIVE</span>
        </div>

        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Book a Session</h1>
          <p className="text-gray-400 mt-0.5 text-sm">Schedule Studio A or Studio B</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
            <AlertCircle size={15} className="flex-shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Info */}
          <section className="rounded-xl p-4 md:p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <h3 className="font-display text-base font-semibold mb-4" style={{ color: '#EAB308' }}>Client Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Client Name *</label>
                <input required className={inp} style={inpStyle} placeholder="Full name"
                  value={form.clientName} onChange={e => set('clientName', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                <input className={inp} style={inpStyle} placeholder="404-555-0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input type="email" className={inp} style={inpStyle} placeholder="client@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Instagram Handle</label>
                <input className={inp} style={inpStyle} placeholder="@handle"
                  value={form.ig} onChange={e => set('ig', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Salesperson (for commission)</label>
                <select className={inp} style={selStyle} value={form.salespersonId} onChange={e => set('salespersonId', e.target.value)}>
                  <option value="">— None —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Session Details */}
          <section className="rounded-xl p-4 md:p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <h3 className="font-display text-base font-semibold mb-4" style={{ color: '#EAB308' }}>Session Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Studio *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Studio A','Studio B'].map(s => (
                    <button key={s} type="button"
                      onClick={() => { set('studio', s); set('service', s === 'Studio A' ? STUDIO_A_SERVICES[0] : STUDIO_B_SERVICES[0]) }}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={form.studio === s
                        ? { background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', border: '1px solid #6B21A8' }
                        : { background: '#0F0A1E', color: '#9CA3AF', border: '1px solid #2D1F4E' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Service *</label>
                <select required className={inp} style={selStyle} value={form.service} onChange={e => set('service', e.target.value)}>
                  {services.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date *</label>
                <input required type="date" className={inp} style={inpStyle} value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start Time *</label>
                <input required type="time" className={inp} style={inpStyle} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Duration (minutes)</label>
                <select className={inp} style={selStyle} value={form.duration} onChange={e => set('duration', parseInt(e.target.value))}>
                  {[30,60,90,120,180,240,300,360].map(d => <option key={d} value={d}>{d>=60?`${d/60}h${d%60?` ${d%60}m`:''}` : `${d}m`}</option>)}
                </select>
              </div>
            </div>

            {/* Multi-assign employees */}
            <div className="mt-4">
              <label className="text-xs text-gray-400 mb-2 block">Assigned Employees (up to 3)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[0,1,2].map(i => (
                  <div key={i} className="relative">
                    <select className={inp} style={selStyle} value={form.empIds[i]} onChange={e => setEmp(i, e.target.value)}>
                      <option value="">— Employee {i+1} —</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                    {form.empIds[i] && (
                      <button type="button" onClick={() => setEmp(i,'')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Deliverables & Payment */}
          <section className="rounded-xl p-4 md:p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <h3 className="font-display text-base font-semibold mb-4" style={{ color: '#EAB308' }}>Deliverables</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {[{k:'fullVideo',l:'Full Video'},{k:'audioBounce',l:'Audio Bounce'},{k:'thumbnail',l:'Thumbnail'},{k:'other',l:'Other'}].map(({k,l}) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-all"
                  style={{ background: (form.deliverables as Record<string,unknown>)[k] ? 'rgba(107,33,168,0.25)' : '#0F0A1E', border: '1px solid #2D1F4E' }}>
                  <input type="checkbox" checked={!!(form.deliverables as Record<string,unknown>)[k]}
                    onChange={e => setDel(k, e.target.checked)} className="w-3.5 h-3.5 accent-purple-600" />
                  <span className="text-sm text-white">{l}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg col-span-2 sm:col-span-1"
                style={{ background: form.deliverables.socialClips > 0 ? 'rgba(107,33,168,0.25)' : '#0F0A1E', border: '1px solid #2D1F4E' }}>
                <input type="checkbox" checked={form.deliverables.socialClips > 0}
                  onChange={e => setDel('socialClips', e.target.checked ? 1 : 0)} className="w-3.5 h-3.5 accent-purple-600" />
                <span className="text-sm text-white flex-1">Social Clips</span>
                {form.deliverables.socialClips > 0 && (
                  <input type="number" min={1} max={20} value={form.deliverables.socialClips}
                    onChange={e => setDel('socialClips', parseInt(e.target.value))}
                    className="w-10 text-center text-xs rounded text-white outline-none"
                    style={{ background: '#1A1030', border: '1px solid #2D1F4E' }} />
                )}
              </label>
            </div>
            {form.deliverables.other && (
              <input className={`${inp} mb-4`} style={inpStyle} placeholder="Describe other deliverable..."
                value={form.deliverables.otherNote} onChange={e => setDel('otherNote', e.target.value)} />
            )}

            <h3 className="font-display text-base font-semibold mb-3 mt-2" style={{ color: '#EAB308' }}>Payment Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select className={inp} style={selStyle} value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
                  {PAYMENT_STATUSES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Deadline</label>
                <select className={inp} style={selStyle} value={form.deadline} onChange={e => set('deadline', e.target.value)}>
                  <option>24-48 hrs</option><option>3-5 days</option><option>1 week</option><option>Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Total Amount ($)</label>
                <input type="number" step="0.01" min="0" className={inp} style={inpStyle} placeholder="0.00"
                  value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount Paid ($)</label>
                <input type="number" step="0.01" min="0" className={inp} style={inpStyle} placeholder="0.00"
                  value={form.amountPaid} onChange={e => set('amountPaid', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Late Fee ($)</label>
                <input type="number" step="0.01" min="0" className={inp} style={inpStyle} placeholder="0.00"
                  value={form.lateFee} onChange={e => set('lateFee', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Balance Due</label>
                <div className="px-3 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#0F0A1E', border: '1px solid #2D1F4E', color: balance > 0 ? '#FCA5A5' : '#86EFAC' }}>
                  ${balance.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Reschedule / Cancel actions */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button type="button" onClick={() => set('paymentStatus','Rescheduled')}
                className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(234,179,8,0.12)', color: '#FDE047', border: '1px solid rgba(234,179,8,0.25)' }}>
                🔄 Mark Rescheduled
              </button>
              <button type="button" onClick={() => set('paymentStatus','Cancelled')}
                className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}>
                ✕ Cancel Session
              </button>
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-xl p-4 md:p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea rows={3} className={`${inp} resize-none`} style={inpStyle}
              placeholder="Any additional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </section>

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-display font-bold text-base transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6B21A8,#4C1D95)', color: '#EAB308', boxShadow: '0 0 24px rgba(107,33,168,0.4)' }}>
            {loading ? 'Booking...' : '⚡ Book Session'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
