'use client'
import { SESSIONS } from '@/lib/data'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin, User, CreditCard } from 'lucide-react'

export default function SessionPage() {
  const { id } = useParams()
  const session = SESSIONS.find(s => s.id === id)

  if (!session) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: '#4B5563', fontSize: 14 }}>Session not found.</p>
        <Link href="/dashboard" style={{ color: '#A78BFA', fontSize: 13, marginTop: 12, display: 'inline-block' }}>← Back to Dashboard</Link>
      </div>
    )
  }

  const isPaid = session.status !== 'Unpaid'

  return (
    <div style={{ padding: '20px 24px', maxWidth: 700 }}>
      <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', textDecoration: 'none', marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', display: 'inline-block', marginBottom: 4 }}>SESSION</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>{session.client}</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>{session.type}</p>
      </div>

      <div style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
        {[
          { Icon: Clock,     label: 'Date & Time', value: `${session.date} at ${session.time}` },
          { Icon: MapPin,    label: 'Room',        value: session.room },
          { Icon: User,      label: 'Engineer',    value: session.engineer === 'A' ? 'Marcus Webb' : 'Jordan Lee' },
          { Icon: CreditCard,label: 'Payment',     value: session.status },
        ].map(({ Icon, label, value }, i, arr) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #1A1F38' : 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0C0F1E', border: '1px solid #1A1F38', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={14} style={{ color: '#6B7280' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#4B5563' }}>{label}</div>
              <div style={{ fontSize: 13, color: label === 'Payment' ? (isPaid ? '#34D399' : '#F87171') : '#E8ECF4', fontWeight: 500, marginTop: 1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {!isPaid && (
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, background: 'linear-gradient(135deg,#6D28D9,#7C3AED)', color: '#F59E0B', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Mark as Paid
        </button>
      )}
    </div>
  )
}
