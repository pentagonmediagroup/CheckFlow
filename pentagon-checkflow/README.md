# 🎙️ Pentagon CheckFlow

Studio operating system for **The Pentagon** multimedia studio.

**Purple + Gold | Studio A + B | Booking → Tasks → Delivery**

---

## ✅ Features

- **Login** (email + password, no signup — add users in Supabase Auth)
- **Dashboard** — upcoming sessions, active tasks, quick stats
- **Book Session** — full form with conflict detection + 30-min buffer
- **Calendar** — week view with Studio A/B color coding
- **Task Pipeline** — Trello-style drag & drop (8 stages)
- **Clients CRM** — roster with session history
- **Session Detail** — full session view + delivery/payment messaging
- **Cashflow Dashboard** — owner-only revenue analytics

---

## 🛠 Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/pentagon-checkflow.git
cd pentagon-checkflow
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Go to **SQL Editor** → **New Query**
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run**

### 3. Add Environment Variables
Copy `.env.local.example` → `.env.local`
```bash
cp .env.local.example .env.local
```
Fill in from your Supabase project settings (Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Create Users in Supabase
1. Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Create users with email + password
3. Then in **SQL Editor**, run:
```sql
-- Set a user as owner (replace the email)
update users set role = 'owner' where email = 'you@email.com';
```

### 5. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploy to Vercel

### Option A: GitHub → Vercel
```bash
git init
git add .
git commit -m "Initial Pentagon CheckFlow build"
git remote add origin https://github.com/YOUR_USERNAME/pentagon-checkflow.git
git push -u origin main
```
Then:
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Add environment variables (same as `.env.local`)
3. Deploy!

### Option B: Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
```

---

## 🔐 Role-Based Access

| Feature | Owner | Manager |
|---------|-------|---------|
| Dashboard | ✅ | ✅ |
| Booking | ✅ | ✅ |
| Calendar | ✅ | ✅ |
| Task Pipeline | ✅ | ✅ |
| Clients | ✅ | ✅ |
| **Cashflow** | ✅ | ❌ |

---

## 🎨 Brand Colors

- **Primary Purple**: `#6B21A8`
- **Gold Accent**: `#EAB308`
- **Dark Background**: `#0F0A1E`
- **Card Surface**: `#1A1030`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── login/         # Auth page
│   ├── dashboard/     # Main overview
│   ├── book/          # Booking form
│   ├── calendar/      # Week view
│   ├── tasks/         # Drag-drop pipeline
│   ├── clients/       # CRM
│   ├── cashflow/      # Owner-only analytics
│   └── sessions/[id]/ # Session detail
├── components/
│   ├── Sidebar.tsx    # Navigation
│   └── AppShell.tsx   # Auth guard + layout
└── lib/
    ├── supabase.ts    # Supabase client
    ├── auth.tsx       # Auth context
    └── mockData.ts    # Demo data
supabase/
└── schema.sql         # Full DB schema + RLS
```

---

## 💬 Message Templates (Auto-copied to clipboard)

**Delivery (Paid in Full):**
> Yo [Name] — your files are ready. Here's your link: [LINK].
> Includes: [deliverables].
> 1 revision (2 days). Extra revisions: $75.

**Payment Required:**
> Hey [Name] — your files are ready.
> Remaining balance required before release.

These populate automatically from the session data when you click the action buttons.
