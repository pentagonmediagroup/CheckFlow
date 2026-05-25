# StudioFlow — Update Package
## Files included & where they go

| File in this zip                        | Drop into your repo at                           |
|-----------------------------------------|--------------------------------------------------|
| src/app/layout.tsx                      | src/app/layout.tsx                               |
| src/app/login/page.tsx                  | src/app/login/page.tsx                           |
| src/components/AppShell.tsx             | src/components/AppShell.tsx                      |
| src/app/tasks/page.tsx                  | src/app/tasks/page.tsx                           |
| src/app/settings/page.tsx               | src/app/settings/page.tsx                        |
| src/app/cashflow/page.tsx               | src/app/cashflow/page.tsx                        |
| src/app/sessions/[id]/page.tsx          | src/app/sessions/[id]/page.tsx                   |
| src/app/book/page.tsx                   | src/app/book/page.tsx                            |
| migration.sql                           | Run in Supabase SQL Editor (once)                |

## What each file does

### layout.tsx
- Title changed to "StudioFlow"

### login/page.tsx
- Full rebrand: STUDIOFLOW logo, "THE PENTAGON" tagline

### AppShell.tsx
- Sidebar/nav: STUDIOFLOW header, all branding updated
- Mobile bottom nav updated

### tasks/page.tsx
- Added **SOP tab** next to Task Pipeline tab
- Studio B SOP pre-built with 12 steps
- Create SOP (text import + manual builder)
- Sequential step enforcement
- Progress tracking + percentage bar
- Auto-save to localStorage
- Completion history view
- Every action writes to Supabase audit_log

### settings/page.tsx
- **Audit Log pagination**: 10/25/50 per page, "Showing X–Y of Z records", prev/next/page selector
- SOP actions highlighted (SOP_STARTED, SOP_STEP, SOP_COMPLETED)
- StudioFlow branding

### cashflow/page.tsx
- **Editable commissions**: click "Edit Commissions"
  - Global rate (default 25%, change to anything)
  - Per-employee custom rate %
  - Per-employee manual dollar adjustment
  - Save persists to studio_settings table

### sessions/[id]/page.tsx
- **Payment Status** displayed as a dedicated field with color badge
- **Non-Cash Services** field: multi-select (Trade/Barter, Sponsorship Credit, etc.)
- Non-cash services saved to sessions table and visible in session detail

### book/page.tsx
- **Non-Cash Services** selector added to Deliverables & Payment section
- **Staff notifications**: on every booking, all employees in the `employees` table get an in-app notification with client name, service, studio, date/time, engineer
- Notification preview shown before submitting
- "Staff notified" confirmation on success screen

## Database migration
Run `migration.sql` in your Supabase SQL Editor **before deploying**.
It adds:
- `non_cash_services` column to `sessions` and `history_log`
- `notifications` table with RLS
- `metadata` column to `audit_log`

## Deploy
```bash
git add .
git commit -m "StudioFlow rebrand + SOP module + pagination + notifications + commissions + deliverables"
git push
```
Vercel will auto-deploy from main.
