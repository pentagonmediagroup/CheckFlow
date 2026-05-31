'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SERVICES = [
  'Recording Session','Mixing','Mastering',
  'Vocal Booth','Band Rehearsal','Podcast',
  'Photography','Video Production','Interview'
]



const DURATIONS = [
  { label: '1 hour',  value: 60  },
  { label: '2 hours', value: 120 },
]

type Step = 'details' | 'datetime' | 'confirm' | 'done'

export default function PublicBookingPage() {
  const [step, setStep]       = useState<Step>('details')
  const [saving, setSaving]   = useState(false)
  const [conflict, setConflict] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    service: 'Recording Session',
    duration: 60,
    date: '', start_time: '',
    notes: '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))



  // Compute end time
  function getEndTime(date: string, start: string, duration: number) {
    if (!date || !start) return ''
    const [h, m] = start.split(':').map(Number)
    const mins = h * 60 + (m || 0) + duration
    const endH = String(Math.floor(mins / 60) % 24).padStart(2, '0')
    const endM = String(mins % 60).padStart(2, '0')
    return `${date}T${endH}:${endM}:00`
  }

  // Check conflict when date/time changes
  useEffect(() => {
    if (!form.date || !form.start_time) { setConflict(null); return }
    setChecking(true)
    const startTs = `${form.date}T${form.start_time}:00`
    const endTs   = getEndTime(form.date, form.start_time, form.duration)
    // Check both studios — assign to first available
    supabase.rpc('check_studio_conflict', { p_studio: 'Studio A', p_start: startTs, p_end: endTs })
      .then(({ data: aData }) => {
        if (!aData || aData.length === 0) { setConflict(null); setChecking(false); return }
        // Studio A busy — check Studio B
        supabase.rpc('check_studio_conflict', { p_studio: 'Studio B', p_start: startTs, p_end: endTs })
          .then(({ data: bData }) => {
            if (!bData || bData.length === 0) { setConflict(null); setChecking(false); return }
            // Both busy
            setConflict({ both: true })
            setChecking(false)
          })
      })
  }, [form.date, form.start_time, form.duration])

  // Assign studio (first available)
  async function getAvailableStudio(): Promise<string> {
    const startTs = `${form.date}T${form.start_time}:00`
    const endTs   = getEndTime(form.date, form.start_time, form.duration)
    const { data } = await supabase.rpc('check_studio_conflict', { p_studio: 'Studio A', p_start: startTs, p_end: endTs })
    return (!data || data.length === 0) ? 'Studio A' : 'Studio B'
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const studio   = await getAvailableStudio()
      const startTs  = `${form.date}T${form.start_time}:00`
      const endTs    = getEndTime(form.date, form.start_time, form.duration)

      // Upsert client — update email/phone if client already exists
      let clientId: string | null = null
      const { data: existing } = await supabase
        .from('clients').select('id').ilike('name', form.name.trim()).maybeSingle()
      if (existing) {
        clientId = existing.id
        // Update email so the booking confirmation email goes to the right address
        await supabase.from('clients').update({
          email: form.email || undefined,
          phone: form.phone || undefined,
        }).eq('id', clientId)
      } else {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({ name: form.name.trim(), email: form.email, phone: form.phone })
          .select('id').single()
        clientId = newClient?.id || null
      }

      // Insert session
      const { data: session, error } = await supabase.from('sessions').insert({
        client_id:      clientId,
        client_name:    form.name.trim(),
        session_type:   form.service,
        service:        form.service,
        studio,
        date:           form.date,
        start_time:     startTs,
        end_time:       endTs,
        total_amount:   0,
        amount_owed:    0,
        amount_paid:    0,
        payment_status: 'Pending',
        notes:          form.notes,
        booked_via:     'public',
      }).select('id').single()
      if (error) throw error

      // Calendar event — must match exact calendar_events columns
      await supabase.from('calendar_events').insert({
        title:       `${form.name.trim()} – ${form.service}`,
        notes:       form.notes || null,
        start_time:  startTs,
        end_time:    endTs,
        event_type:  'Session',
        studio,
        session_id:  session!.id,
        date:        form.date,
        color:       studio === 'Studio A' ? '#8B5CF6' : '#06B6D4',
        assigned_to: null,
      })

      // Task
      await supabase.from('tasks').insert({
        session_id:    session!.id,
        client_name:   form.name.trim(),
        task_type:     form.service,
        stage:         'Setup',
        status:        'Setup',
        pipeline_name: 'Default',
      })

      setSessionId(session!.id)
      setStep('done')
    } catch (e: any) {
      alert('Something went wrong: ' + (e.message || e))
    } finally {
      setSaving(false)
    }
  }

  // ── Styles ────────────────────────────────────────────────
  const pageStyle: React.CSSProperties = {
    minHeight: '100dvh',
    background: '#05050f',
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    color: '#E8ECF4',
    padding: '0 0 80px',
  }

  const inp: React.CSSProperties = {
    background: '#0d0d1f',
    border: '1px solid #1e1e38',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 16,
    color: '#E8ECF4',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const card: React.CSSProperties = {
    background: '#0d0d1f',
    border: '1px solid #1a1a30',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 14,
  }

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#4B5563',
    marginBottom: 6,
  }

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    cursor: 'pointer',
    letterSpacing: '0.02em',
  }

  const btnSecondary: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    background: 'transparent',
    border: '1px solid #1e1e38',
    borderRadius: 14,
    fontSize: 15,
    color: '#6B7280',
    cursor: 'pointer',
    marginBottom: 10,
  }

  if (step === 'done') return (
    <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '2px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 24 }}>⚡</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>You're Booked!</h1>
      <p style={{ color: '#6B7280', marginBottom: 28, lineHeight: 1.6 }}>
        Your session request has been received.<br />
        A confirmation email is on its way to <strong style={{ color: '#E8ECF4' }}>{form.email}</strong>.
      </p>
      <div style={{ ...card, width: '100%', maxWidth: 380, textAlign: 'left' }}>
        <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Booking Summary</div>
        {[
          ['Service',  form.service],
          ['Date',     new Date(form.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })],
          ['Time',     (() => { const [h,m] = form.start_time.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}` })()],
          ['Duration', `${form.duration / 60} hour${form.duration > 60 ? 's' : ''}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a30', fontSize: 14 }}>
            <span style={{ color: '#6B7280' }}>{k}</span>
            <span style={{ color: '#E8ECF4', fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#374151', marginTop: 20 }}>The Pentagon Studio · Atlanta, GA</p>
    </div>
  )

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid #0f0f20', marginBottom: 8 }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.05em' }}>THE PENTAGON</div>
              <div style={{ fontSize: 11, color: '#4B5563', letterSpacing: '0.1em' }}>ATLANTA RECORDING STUDIO</div>
            </div>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '16px 0 4px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Book a Session</h1>
          <p style={{ color: '#4B5563', fontSize: 14, margin: 0 }}>Reserve your studio time in minutes. No account needed.</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, paddingTop: 16 }}>
          {(['details','datetime','confirm'] as Step[]).map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: step === s ? '#7c3aed' : ['details','datetime','confirm'].indexOf(step) > i ? '#4f46e5' : '#1a1a30' }} />
          ))}
        </div>

        {/* Step 1: Details */}
        {step === 'details' && (
          <>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f5a623', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><label style={label}>Full Name *</label><input style={inp} placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} /></div>
                <div><label style={label}>Email *</label><input style={inp} type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                <div><label style={label}>Phone</label><input style={inp} type="tel" placeholder="404-000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f5a623', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Service</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SERVICES.map(s => (
                  <button key={s} type="button" onClick={() => set('service', s)} style={{
                    padding: '12px 10px', borderRadius: 12, fontSize: 13, fontWeight: form.service === s ? 700 : 400,
                    cursor: 'pointer', textAlign: 'left',
                    border: `1.5px solid ${form.service === s ? '#7c3aed' : '#1e1e38'}`,
                    background: form.service === s ? 'rgba(124,58,237,.15)' : '#080815',
                    color: form.service === s ? '#a78bfa' : '#6B7280',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f5a623', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duration</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 280 }}>
                {DURATIONS.map(d => (
                  <button key={d.value} type="button" onClick={() => set('duration', d.value)} style={{
                    padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: form.duration === d.value ? 700 : 400,
                    cursor: 'pointer', textAlign: 'center',
                    border: `1.5px solid ${form.duration === d.value ? '#7c3aed' : '#1e1e38'}`,
                    background: form.duration === d.value ? 'rgba(124,58,237,.15)' : '#080815',
                    color: form.duration === d.value ? '#a78bfa' : '#6B7280',
                  }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={card}>
              <label style={label}>Notes / Requests</label>
              <textarea rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Any special requests, equipment needs, etc." value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            <button style={{ ...btnPrimary, opacity: !form.name || !form.email ? 0.5 : 1 }}
              disabled={!form.name || !form.email}
              onClick={() => setStep('datetime')}>
              Continue →
            </button>
          </>
        )}

        {/* Step 2: Date & Time */}
        {step === 'datetime' && (
          <>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f5a623', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pick a Date & Time</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={label}>Date *</label>
                  <input style={inp} type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div>
                  <label style={label}>Start Time *</label>
                  <input style={inp} type="time" step="3600" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Conflict warning */}
            {checking && (
              <div style={{ padding: '12px 16px', background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 12, marginBottom: 14, fontSize: 13, color: '#f5a623' }}>
                Checking availability…
              </div>
            )}
            {conflict?.both && !checking && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, marginBottom: 14, fontSize: 13, color: '#F87171' }}>
                ⚠️ Both studios are booked at this time. Please choose a different date or time.
              </div>
            )}
            {form.date && form.start_time && !conflict && !checking && (
              <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 12, marginBottom: 14, fontSize: 13, color: '#34D399' }}>
                ✓ This time is available
              </div>
            )}

            <button style={{ ...btnPrimary, opacity: !form.date || !form.start_time || !!conflict?.both ? 0.5 : 1 }}
              disabled={!form.date || !form.start_time || !!conflict?.both}
              onClick={() => setStep('confirm')}>
              Review Booking →
            </button>
            <button style={btnSecondary} onClick={() => setStep('details')}>← Back</button>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f5a623', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Review Your Booking</div>
              {[
                ['Name',     form.name],
                ['Email',    form.email],
                ['Phone',    form.phone || '—'],
                ['Service',  form.service],
                ['Date',     new Date(form.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })],
                ['Time',     (() => { const [h,m] = form.start_time.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}` })()],
                ['Duration', `${form.duration / 60} hour${form.duration > 60 ? 's' : ''}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #111124', fontSize: 14 }}>
                  <span style={{ color: '#6B7280' }}>{k}</span>
                  <span style={{ color: '#E8ECF4', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Pricing handled by team */}
            <div style={{ ...card, border: '1px solid rgba(124,58,237,.2)', background: 'rgba(124,58,237,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 22 }}>📞</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>We'll reach out about pricing</div>
                  <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.6 }}>
                    Once we receive your request, a team member will contact you to confirm availability and go over rates.
                  </p>
                </div>
              </div>
            </div>

            {form.notes && (
              <div style={{ ...card, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Notes</div>
                <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>{form.notes}</p>
              </div>
            )}

            <button style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={handleSubmit}>
              {saving ? 'Confirming…' : '⚡ Confirm Booking'}
            </button>
            <button style={btnSecondary} onClick={() => setStep('datetime')}>← Back</button>
          </>
        )}
      </div>
    </div>
  )
}
