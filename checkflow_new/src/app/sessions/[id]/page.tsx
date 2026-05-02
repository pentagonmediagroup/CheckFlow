'use client'

import { useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { MOCK_SESSIONS, TASK_STAGES } from '@/lib/mockData'
import { format } from 'date-fns'
import { ArrowLeft, Clock, MapPin, User, CreditCard, FileText, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SessionDetailPage() {
  const params = useParams()
  const sessionId = params.id as string

  const session = MOCK_SESSIONS.find(s => s.id === sessionId)

  if (!session) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-gray-400">Session not found</p>
          <Link href="/dashboard" className="text-yellow-400 hover:underline mt-2 block text-sm">← Back</Link>
        </div>
      </AppShell>
    )
  }

  const task = session.tasks[0]
  const currentStageIndex = TASK_STAGES.indexOf(task?.status || 'Setup')
  const isPaid = session.payment_status === 'Paid in Full'

  const handleMessage = (type: 'delivery' | 'payment') => {
    const deliverables = session.deliverables.map(d => d.quantity > 1 ? `${d.quantity}x ${d.type}` : d.type).join(', ')
    const msg = type === 'delivery'
      ? `Yo ${session.clients.name} — your files are ready. Here's your link: [LINK].\nIncludes: ${deliverables}.\n1 revision (2 days). Extra revisions: $75.`
      : `Hey ${session.clients.name} — your files are ready.\nRemaining balance required before release.`
    navigator.clipboard.writeText(msg)
    alert(`${type === 'delivery' ? 'Delivery' : 'Payment request'} message copied!`)
  }

  return (
    <AppShell>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Back */}
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">{session.clients.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={session.studio === 'Studio A'
                  ? { background: 'rgba(107,33,168,0.3)', color: '#C084FC' }
                  : { background: 'rgba(234,179,8,0.2)', color: '#FDE047' }}>
                {session.studio}
              </span>
              <span className="text-sm text-gray-400">{session.service}</span>
            </div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${isPaid ? 'text-green-400' : 'text-red-400'}`}
            style={{ background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isPaid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            {session.payment_status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Session Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Time & Location */}
            <div className="rounded-xl p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <h3 className="font-display text-base font-semibold text-white mb-4">Session Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-yellow-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Start Time</div>
                    <div className="text-sm text-white font-medium">{format(new Date(session.start_time), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">End + Buffer</div>
                    <div className="text-sm text-white font-medium">{format(new Date(session.buffer_end_time), 'h:mm a')}</div>
                    <div className="text-xs text-gray-600">+30 min buffer</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-yellow-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Studio</div>
                    <div className="text-sm text-white font-medium">{session.studio}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User size={16} className="text-yellow-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Engineer</div>
                    <div className="text-sm text-white font-medium">{session.employees.name}</div>
                  </div>
                </div>
              </div>

              {session.notes && (
                <div className="mt-4 p-3 rounded-lg" style={{ background: '#0F0A1E' }}>
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-gray-500 mt-0.5" />
                    <p className="text-sm text-gray-300">{session.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Deliverables */}
            <div className="rounded-xl p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <h3 className="font-display text-base font-semibold text-white mb-4">Deliverables</h3>
              <div className="grid grid-cols-2 gap-2">
                {session.deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg"
                    style={{ background: '#0F0A1E', border: '1px solid #2D1F4E' }}>
                    <CheckCircle size={14} style={{ color: '#EAB308' }} />
                    <span className="text-sm text-white">
                      {d.quantity > 1 ? `${d.quantity}× ` : ''}{d.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Progress */}
            <div className="rounded-xl p-6" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <h3 className="font-display text-base font-semibold text-white mb-4">Pipeline Progress</h3>
              <div className="space-y-2">
                {TASK_STAGES.map((stage, i) => {
                  const isDone = i < currentStageIndex
                  const isCurrent = i === currentStageIndex
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isDone ? '#22C55E' : isCurrent ? '#6B21A8' : '#2D1F4E',
                          border: isCurrent ? '2px solid #EAB308' : 'none'
                        }}>
                        {isDone ? <CheckCircle size={14} className="text-white" /> : (
                          <span className="text-xs font-bold text-white">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${isDone ? 'text-gray-500 line-through' : isCurrent ? 'text-white font-medium' : 'text-gray-600'}`}>
                        {stage}
                      </span>
                      {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(234,179,8,0.2)', color: '#EAB308' }}>Current</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Client + Actions */}
          <div className="space-y-4">
            {/* Client Card */}
            <div className="rounded-xl p-5" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <h3 className="font-display text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Client</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg"
                  style={{ background: 'linear-gradient(135deg, #6B21A8, #4C1D95)', color: '#EAB308' }}>
                  {session.clients.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-white">{session.clients.name}</div>
                  <div className="text-xs text-gray-500">{session.clients.ig}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div>{session.clients.phone}</div>
                <div className="truncate">{session.clients.email}</div>
              </div>
            </div>

            {/* Payment + Delivery Actions */}
            <div className="rounded-xl p-5" style={{ background: '#1A1030', border: '1px solid #2D1F4E' }}>
              <h3 className="font-display text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Actions</h3>

              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg"
                style={{ background: '#0F0A1E' }}>
                <CreditCard size={14} className="text-gray-500" />
                <span className="text-xs text-gray-400">Payment:</span>
                <span className={`text-xs font-semibold ml-auto ${isPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                  {session.payment_status}
                </span>
              </div>

              {task?.status === 'Ready to Send' && (
                <div className="space-y-2">
                  {isPaid ? (
                    <button onClick={() => handleMessage('delivery')}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgba(34,197,94,0.2)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.4)' }}>
                      📤 Copy Delivery Message
                    </button>
                  ) : (
                    <button onClick={() => handleMessage('payment')}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.4)' }}>
                      💰 Copy Payment Request
                    </button>
                  )}
                </div>
              )}

              <Link href="/tasks"
                className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-center flex items-center justify-center transition-all"
                style={{ background: 'rgba(107,33,168,0.2)', color: '#C084FC', border: '1px solid rgba(107,33,168,0.4)' }}>
                View in Pipeline →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
