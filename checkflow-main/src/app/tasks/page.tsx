'use client'
import { TASKS } from '@/lib/data'
import { SquareCheckBig } from 'lucide-react'

const STAGES = ['Setup', 'Recording Complete', 'QC Check', 'Editing', 'File Naming', 'Upload', 'Ready to Send']

export default function TasksPage() {
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.12)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.25)', display: 'inline-block', marginBottom: 4 }}>TASKS</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.02em' }}>Task Pipeline</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>Track sessions through the production workflow</p>
      </div>

      {/* Kanban */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
        {STAGES.map((stage) => {
          const stageTasks = TASKS.filter(t => t.stage === stage)
          return (
            <div key={stage} style={{ minWidth: 220, flex: '0 0 220px', background: '#0C0F1E', border: '1px solid #1A1F38', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #1A1F38', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>{stage}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#1A1F38', color: '#6B7280', fontFamily: 'monospace' }}>{stageTasks.length}</span>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
                {stageTasks.map((t) => (
                  <div key={t.id} style={{ background: '#111525', border: '1px solid #1E2340', borderRadius: 8, padding: '10px 10px 10px 12px', borderLeft: `3px solid ${t.color}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#E8ECF4', marginBottom: 2 }}>{t.client}</div>
                    <div style={{ fontSize: 10, color: '#4B5563' }}>{t.type}</div>
                  </div>
                ))}
                {stageTasks.length === 0 && (
                  <div style={{ fontSize: 11, color: '#374151', textAlign: 'center', padding: '12px 0' }}>—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
