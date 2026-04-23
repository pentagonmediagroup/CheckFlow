'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { STUDIO_A_SERVICES, STUDIO_B_SERVICES, MOCK_EMPLOYEES, PAYMENT_STATUSES } from '@/lib/mockData'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { addMinutes } from 'date-fns'

const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
const inputStyle = { background: '#0F0A1E', border: '1px solid #2D1F4E' }

export default function BookPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    clientName: '', phone: '', email: '', ig: '',
    studio: 'Studio A', service: STUDIO_A_SERVICES[0],
    date: '', startTime: '', duration: 60,
    employee: MOCK_EMPLOYEES[0].id,
    paymentStatus: 'Deposit Paid',
    notes: '',
    deadline: '24-48 hrs',
    deliverables: {
      fullVideo: false, socialClips: 0, audioBounce: false,
      thumbnail: false, other: false, otherNote: ''
    }
  })

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }))
  const setDeliverable = (key: string, value: unknown) =>
    setForm(prev => ({ ...prev, deliverables: { ...prev.deliverables, [key]: value } }))

  const services = form.studio === 'Studio A' ? STUDIO_A_SERVICES : STUDIO_B_SERVICES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const startDT = new Date(`${form.date}T${form.startTime}`)
      const endDT = addMinutes(startDT, form.duration)
      const bufferDT = addMinutes(endDT, 30)

      // Check for conflicts (mock check — in prod use Supabase RPC)
      // Upsert client
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .upsert({ name: form.clientName, phone: form.phone, email: form.email, ig: form.ig }, { onConflict: 'email' })
        .select().single()

      if (clientErr) throw clientErr

      // Create session
      const { data: session, error: sessionErr } = await supabase
        .from('sessions')
        .insert({
          client_id: client.id,
          employee_id: form.employee,
          studio: form.studio,
          service: form.service,
          start_time: startDT.toISOString(),
          end_time: endDT.toISOString(),
          buffer_end_time: bufferDT.toISOString(),
          payment_status: form.paymentStatus,
          notes: form.notes,
        })
        .select().single()

      if (sessionErr) throw sessionErr

      // Create deliverables
      const delivs = []
      if (form.deliverables.fullVideo) delivs.push({ session_id: session.id, type: 'Full Video', quantity: 1 })
      if (form.deliverables.socialClips > 0) delivs.push({ session_id: session.id, type: 'Social Clips', quantity: form.deliverables.socialClips })
      if (form.deliverables.audioBounce) delivs.push({ session_id: session.id, type: 'Audio Bounce', quantity: 1 })
      if (form.deliverables.thumbnail) delivs.push({ session_id: session.id, type: 'Thumbnail', quantity: 1 })
      if (form.deliverables.other) delivs.push({ session_id: session.id, type: form.deliverables.otherNote || 'Other', quantity: 1 })

      if (delivs.length > 0) {
        await supabase.from('deliverables').insert(delivs)
      }

      // Auto-create task
      await supabase.from('tasks').insert({
        session_id: session.id,
        status: 'Setup',
        assigned_to: form.employee,
      })

      setSuccess(true)
      setTimeout(() => router.push('/tasks'), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed. Using demo mode.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <CheckCircle size={64} className="mx-auto mb-4" style={{ color: '#22C55E' }} />
            <h2 className="font-display text-2xl font-bold text-white mb-2">Session Booked!</h2>
            <p className="text-gray-400">Redirecting to task pipeline...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">Book a Session</h1>
          <p className="text-gray-400 mt-1">Schedule Studio A or Studio B</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl mb-6 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Info */}
          <div className="rounded-xl p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <h3 className="font-display text-lg font-semibold mb-4" style={{ color: '#EAB308' }}>Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Client Name *</label>
                <input required className={inputClass} style={inputStyle} placeholder="Full name"
                  value={form.clientName} onChange={e => set('clientName', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
                <input className={inputClass} style={inputStyle} placeholder="404-555-0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                <input type="email" className={inputClass} style={inputStyle} placeholder="client@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Instagram Handle</label>
                <input className={inputClass} style={inputStyle} placeholder="@handle"
                  value={form.ig} onChange={e => set('ig', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="rounded-xl p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <h3 className="font-display text-lg font-semibold mb-4" style={{ color: '#EAB308' }}>Session Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Studio */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Studio *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Studio A', 'Studio B'].map(s => (
                    <button key={s} type="button"
                      onClick={() => { set('studio', s); set('service', s === 'Studio A' ? STUDIO_A_SERVICES[0] : STUDIO_B_SERVICES[0]) }}
                      className="py-3 rounded-xl text-sm font-semibold transition-all"
                      style={form.studio === s ? {
                        background: 'linear-gradient(135deg, #6B21A8, #4C1D95)',
                        color: '#EAB308', border: '1px solid #6B21A8'
                      } : { background: '#0F0A1E', color: '#9CA3AF', border: '1px solid #2D1F4E' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Service *</label>
                <select required className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.service} onChange={e => set('service', e.target.value)}>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Date *</label>
                <input required type="date" className={inputClass} style={inputStyle}
                  value={form.date} onChange={e => set('date', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Start Time *</label>
                <input required type="time" className={inputClass} style={inputStyle}
                  value={form.startTime} onChange={e => set('startTime', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (minutes)</label>
                <select className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.duration} onChange={e => set('duration', parseInt(e.target.value))}>
                  {[30, 60, 90, 120, 180, 240, 300, 360].map(d => (
                    <option key={d} value={d}>{d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d}m`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Assigned Employee</label>
                <select className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.employee} onChange={e => set('employee', e.target.value)}>
                  {MOCK_EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Deliverables */}
          <div className="rounded-xl p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <h3 className="font-display text-lg font-semibold mb-4" style={{ color: '#EAB308' }}>Deliverables</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {[
                { key: 'fullVideo', label: 'Full Video' },
                { key: 'audioBounce', label: 'Audio Bounce' },
                { key: 'thumbnail', label: 'Thumbnail' },
                { key: 'other', label: 'Other' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-all"
                  style={{ background: (form.deliverables as Record<string, unknown>)[key] ? 'rgba(107,33,168,0.3)' : '#0F0A1E', border: '1px solid #2D1F4E' }}>
                  <input type="checkbox" checked={!!(form.deliverables as Record<string, unknown>)[key]}
                    onChange={e => setDeliverable(key, e.target.checked)} className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-white">{label}</span>
                </label>
              ))}

              <div className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: '#0F0A1E', border: '1px solid #2D1F4E' }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.deliverables.socialClips > 0}
                    onChange={e => setDeliverable('socialClips', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-white">Social Clips</span>
                </label>
                {form.deliverables.socialClips > 0 && (
                  <input type="number" min={1} max={20} value={form.deliverables.socialClips}
                    onChange={e => setDeliverable('socialClips', parseInt(e.target.value))}
                    className="w-14 px-2 py-1 text-sm rounded text-white ml-auto outline-none"
                    style={{ background: '#1A1030', border: '1px solid #2D1F4E' }} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Deadline</label>
                <select className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.deadline} onChange={e => set('deadline', e.target.value)}>
                  <option>24-48 hrs</option>
                  <option>3-5 days</option>
                  <option>1 week</option>
                  <option>Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Payment Status</label>
                <select className={inputClass} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
                  {PAYMENT_STATUSES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea rows={3} className={`${inputClass} resize-none`} style={inputStyle}
              placeholder="Any additional notes for this session..."
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-display font-bold text-base transition-all"
            style={{
              background: 'linear-gradient(135deg, #6B21A8, #4C1D95)',
              color: '#EAB308',
              boxShadow: '0 0 30px rgba(107,33,168,0.4)',
            }}>
            {loading ? 'Booking...' : '⚡ Book Session'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
