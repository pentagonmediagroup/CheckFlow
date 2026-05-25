-- ============================================================
-- StudioFlow Migration: New fields + Notifications table
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add non_cash_services to sessions
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS non_cash_services text[] DEFAULT '{}';

-- 2. Add non_cash_services to history_log (for archiving)
ALTER TABLE history_log
  ADD COLUMN IF NOT EXISTS non_cash_services text[] DEFAULT '{}';

-- 3. Create notifications table (staff booking alerts + future use)
CREATE TABLE IF NOT EXISTS notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid REFERENCES employees(id) ON DELETE CASCADE,
  session_id   uuid REFERENCES sessions(id)  ON DELETE SET NULL,
  type         text NOT NULL DEFAULT 'new_booking',
  title        text NOT NULL,
  message      text,
  is_read      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  metadata     jsonb DEFAULT '{}'
);

-- Index for fast per-employee queries
CREATE INDEX IF NOT EXISTS notifications_employee_id_idx ON notifications(employee_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx  ON notifications(created_at DESC);

-- 4. Enable RLS on notifications (employees see their own)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_see_own_notifs" ON notifications
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE username = current_user
    )
  );

CREATE POLICY "service_role_all" ON notifications
  FOR ALL USING (true);

-- 5. Add SOP-related metadata column to audit_log (if not exists)
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- ============================================================
-- Done. No existing data is affected.
-- ============================================================
