import { supabase } from './supabase'

export type AuditCategory = 'auth'|'session'|'client'|'staff'|'task'|'pipeline'|'calendar'|'settings'|'cashflow'|'other'

export async function logAudit(params: {
  actor_username: string
  actor_role?: string
  action: string          // e.g. LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW
  category: AuditCategory
  target_type?: string    // e.g. 'session', 'employee', 'client'
  target_name?: string    // human-readable name of the thing touched
  detail?: string         // extra description
  metadata?: Record<string, any>
}) {
  try {
    await supabase.from('audit_log').insert({
      actor_username: params.actor_username,
      actor_role:     params.actor_role || 'unknown',
      action:         params.action,
      category:       params.category,
      target_type:    params.target_type || null,
      target_name:    params.target_name || null,
      detail:         params.detail || null,
      metadata:       params.metadata || null,
    })
  } catch (e) {
    // Never let audit logging crash the app
    console.warn('Audit log failed:', e)
  }
}
