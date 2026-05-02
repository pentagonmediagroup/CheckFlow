-- ============================================
-- PENTAGON CHECKFLOW — SUPABASE SQL SCHEMA
-- Paste this into: Supabase > SQL Editor > New Query > Run
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (mirrors auth.users, adds role)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'manager' check (role in ('owner', 'manager')),
  created_at timestamptz default now()
);

-- Clients
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text unique,
  ig text,
  created_at timestamptz default now()
);

-- Employees
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Sessions (bookings)
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  studio text not null check (studio in ('Studio A', 'Studio B')),
  service text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  buffer_end_time timestamptz not null,
  payment_status text not null default 'Deposit Paid' check (payment_status in ('Deposit Paid', 'Balance Due', 'Paid in Full')),
  notes text,
  created_at timestamptz default now()
);

-- Booking conflict prevention: no overlap including buffer
create or replace function check_booking_conflict()
returns trigger as $$
begin
  if exists (
    select 1 from sessions
    where id != coalesce(new.id, uuid_generate_v4())
      and new.start_time < buffer_end_time
      and new.buffer_end_time > start_time
  ) then
    raise exception 'Booking conflict: another session (including buffer) overlaps this time slot.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger booking_conflict_check
before insert or update on sessions
for each row execute function check_booking_conflict();

-- Deliverables
create table if not exists deliverables (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  type text not null,
  quantity int not null default 1,
  created_at timestamptz default now()
);

-- Tasks (pipeline)
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  status text not null default 'Setup' check (
    status in ('Setup','Recording Complete','QC Check','File Naming','Upload','Editing','Ready to Send','Delivered')
  ),
  assigned_to uuid references employees(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payments
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table users enable row level security;
alter table clients enable row level security;
alter table employees enable row level security;
alter table sessions enable row level security;
alter table deliverables enable row level security;
alter table tasks enable row level security;
alter table payments enable row level security;

-- Allow authenticated users to read/write all tables
create policy "auth_all" on users for all using (auth.role() = 'authenticated');
create policy "auth_all" on clients for all using (auth.role() = 'authenticated');
create policy "auth_all" on employees for all using (auth.role() = 'authenticated');
create policy "auth_all" on sessions for all using (auth.role() = 'authenticated');
create policy "auth_all" on deliverables for all using (auth.role() = 'authenticated');
create policy "auth_all" on tasks for all using (auth.role() = 'authenticated');
create policy "auth_all" on payments for all using (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA — EMPLOYEES
-- ============================================

insert into employees (name) values
  ('Jordan Williams'),
  ('Marcus Davis'),
  ('Tasha Brown')
on conflict do nothing;
