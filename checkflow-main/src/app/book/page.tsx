'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'

const ROOMS = ['Studio A', 'Studio B', 'Vocal Booth', 'Mix Suite', 'Mastering']
const TYPES = ['Recording Session', 'Mixing', 'Mastering', 'Band Rehearsal', 'Vocal Booth', 'Podcast']
const ENGINEERS = ['Marcus Webb', 'Jordan Lee', 'Priya Sharma', 'Devon Torres']

export default function BookPage() {
  const router = useRouter()
  const [form, setForm] = useState({ client: '', type: '', room: '', engineer: '', date: '', time: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.client || !form.type || !form.date) return
    setSubmitted(true)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  if (submitted) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E8ECF4', marginBottom: 6 }}>Session Booked!</h2>
        <p style={{ color: '#6B7280', fontSize: 13 }}>Redirecting to dashboard…</p>
      </div>
    )
  }

  const field = (label: string, key: string, placeholder: string) => (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 5, letterSpacing: '0.06em' }}>{label.toUpperCase()}</label>
      <input value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#E8ECF4', outline: 'none' }} />
    </div>
  )

  const select = (label: string, key: string, opts: string[]) => (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 5, letterSpacing: '0.06em' }}>{label.toUpperCase()}</label>
      <select value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
        style={{ width: '100%', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: form[key as keyof typeof form] ? '#E8ECF4' : '#4B5563', outline: 'none', appearance: 'none' }}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ padding: '20px 24px', maxWidth: 620 }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', display: 'inline-block', marginBottom: 4 }}>BOOK</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>New Session</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>Schedule a studio booking</p>
      </div>

      <div style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {field('Client Name', 'client', 'e.g. The Midnight Echoes')}
        {select('Session Type', 'type', TYPES)}
        {select('Room', 'room', ROOMS)}
        {select('Engineer', 'engineer', ENGINEERS)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Date', 'date', 'YYYY-MM-DD')}
          {field('Time', 'time', 'e.g. 2:00 PM')}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 5, letterSpacing: '0.06em' }}>NOTES</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any special requirements…"
            style={{ width: '100%', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#E8ECF4', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        <button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <CalendarDays size={16} /> Confirm Booking
        </button>
      </div>
    </div>
  )
}
