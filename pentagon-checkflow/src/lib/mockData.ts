// Services - arrays of strings
export const STUDIO_A_SERVICES = [
  'Recording Session',
  'Mixing',
  'Mastering',
  'Vocal Booth',
]

export const STUDIO_B_SERVICES = [
  'Recording Session',
  'Podcast Recording',
  'Voice Over',
  'Band Rehearsal',
]

export const SERVICE_PRICING: Record<string, number> = {
  'Recording Session': 150,
  'Mixing': 250,
  'Mastering': 200,
  'Vocal Booth': 100,
  'Podcast Recording': 100,
  'Voice Over': 75,
  'Band Rehearsal': 180,
}

// Task stages for kanban board — must match STAGE_COLORS keys in tasks/page.tsx
export const TASK_STAGES = [
  'Setup',
  'Recording Complete',
  'QC Check',
  'File Naming',
  'Upload',
  'Editing',
  'Ready to Send',
  'Delivered',
] as const
export type TaskStage = typeof TASK_STAGES[number]

// Employees
export const MOCK_EMPLOYEES = [
  { id: 'e1', name: 'Alex Johnson', role: 'Sound Engineer', studio: 'A', available: true },
  { id: 'e2', name: 'Jamie Lee', role: 'Producer', studio: 'A', available: true },
  { id: 'e3', name: 'Morgan Smith', role: 'Mixing Engineer', studio: 'B', available: false },
  { id: 'e4', name: 'Taylor Brown', role: 'Mastering Engineer', studio: 'B', available: true },
]

// Clients
export const MOCK_CLIENTS = [
  {
    id: 'c1',
    name: 'The Midnight Echoes',
    email: 'contact@midnightechoes.com',
    phone: '555-0101',
    ig: '@midnightechoes',
    totalSessions: 12,
    total_sessions: 12,
    totalSpend: 3200,
    total_spend: 3200,
    lastVisit: '2026-04-10',
    last_visit: '2026-04-10',
  },
  {
    id: 'c2',
    name: 'Sarah Connelly',
    email: 'sarah@example.com',
    phone: '555-0102',
    ig: '@sarahconnelly',
    totalSessions: 5,
    total_sessions: 5,
    totalSpend: 950,
    total_spend: 950,
    lastVisit: '2026-04-15',
    last_visit: '2026-04-15',
  },
  {
    id: 'c3',
    name: 'Neon Wave Band',
    email: 'neonwave@example.com',
    phone: '555-0103',
    ig: '@neonwaveband',
    totalSessions: 8,
    total_sessions: 8,
    totalSpend: 2100,
    total_spend: 2100,
    lastVisit: '2026-04-18',
    last_visit: '2026-04-18',
  },
  {
    id: 'c4',
    name: 'DJ Pulse',
    email: 'djpulse@example.com',
    phone: '555-0104',
    ig: '@djpulse',
    totalSessions: 20,
    total_sessions: 20,
    totalSpend: 5500,
    total_spend: 5500,
    lastVisit: '2026-04-20',
    last_visit: '2026-04-20',
  },
]

// Sessions — includes both camelCase and snake_case, plus nested `clients` for Supabase-style joins
// Each session now includes `tasks` and `deliverables` arrays required by dashboard/page.tsx and tasks/page.tsx
export const MOCK_SESSIONS = [
  {
    id: 's1',
    client_id: 'c1',
    clientId: 'c1',
    client_name: 'The Midnight Echoes',
    clientName: 'The Midnight Echoes',
    clients: { id: 'c1', name: 'The Midnight Echoes', email: 'contact@midnightechoes.com' },
    service: 'Recording Session',
    studio: 'Studio A',
    engineer: 'Alex Johnson',
    date: '2026-04-24',
    start_time: '2026-04-24T10:00:00',
    end_time: '2026-04-24T11:00:00',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    price: 150,
    status: 'confirmed',
    payment_status: 'Paid in Full',
    paymentStatus: 'Paid in Full',
    deliverables: [
      { type: 'Vocal Track', quantity: 1 },
      { type: 'Instrumental Mix', quantity: 2 },
    ],
    tasks: [
      { id: 't1a', status: 'Recording Complete', assigned_to: 'e1' },
      { id: 't1b', status: 'QC Check', assigned_to: 'e2' },
    ],
  },
  {
    id: 's2',
    client_id: 'c2',
    clientId: 'c2',
    client_name: 'Sarah Connelly',
    clientName: 'Sarah Connelly',
    clients: { id: 'c2', name: 'Sarah Connelly', email: 'sarah@example.com' },
    service: 'Vocal Booth',
    studio: 'Studio A',
    engineer: 'Jamie Lee',
    date: '2026-04-24',
    start_time: '2026-04-24T13:00:00',
    end_time: '2026-04-24T14:00:00',
    startTime: '13:00',
    endTime: '14:00',
    duration: 60,
    price: 100,
    status: 'confirmed',
    payment_status: 'Deposit Paid',
    paymentStatus: 'Deposit Paid',
    deliverables: [
      { type: 'Vocal Recording', quantity: 1 },
    ],
    tasks: [
      { id: 't2a', status: 'Setup', assigned_to: 'e2' },
    ],
  },
  {
    id: 's3',
    client_id: 'c3',
    clientId: 'c3',
    client_name: 'Neon Wave Band',
    clientName: 'Neon Wave Band',
    clients: { id: 'c3', name: 'Neon Wave Band', email: 'neonwave@example.com' },
    service: 'Band Rehearsal',
    studio: 'Studio B',
    engineer: 'Taylor Brown',
    date: '2026-04-25',
    start_time: '2026-04-25T14:00:00',
    end_time: '2026-04-25T16:00:00',
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    price: 180,
    status: 'confirmed',
    payment_status: 'Paid in Full',
    paymentStatus: 'Paid in Full',
    deliverables: [
      { type: 'Live Recording', quantity: 1 },
      { type: 'Stem Files', quantity: 4 },
    ],
    tasks: [
      { id: 't3a', status: 'Editing', assigned_to: 'e4' },
    ],
  },
  {
    id: 's4',
    client_id: 'c4',
    clientId: 'c4',
    client_name: 'DJ Pulse',
    clientName: 'DJ Pulse',
    clients: { id: 'c4', name: 'DJ Pulse', email: 'djpulse@example.com' },
    service: 'Mixing',
    studio: 'Studio A',
    engineer: 'Alex Johnson',
    date: '2026-04-26',
    start_time: '2026-04-26T11:00:00',
    end_time: '2026-04-26T13:00:00',
    startTime: '11:00',
    endTime: '13:00',
    duration: 120,
    price: 250,
    status: 'pending',
    payment_status: 'Unpaid',
    paymentStatus: 'Unpaid',
    deliverables: [
      { type: 'Mixed Track', quantity: 1 },
      { type: 'Reference Mix', quantity: 1 },
    ],
    tasks: [
      { id: 't4a', status: 'File Naming', assigned_to: 'e1' },
      { id: 't4b', status: 'Upload', assigned_to: 'e1' },
    ],
  },
  {
    id: 's5',
    client_id: 'c1',
    clientId: 'c1',
    client_name: 'The Midnight Echoes',
    clientName: 'The Midnight Echoes',
    clients: { id: 'c1', name: 'The Midnight Echoes', email: 'contact@midnightechoes.com' },
    service: 'Mastering',
    studio: 'Studio B',
    engineer: 'Morgan Smith',
    date: '2026-04-27',
    start_time: '2026-04-27T15:00:00',
    end_time: '2026-04-27T16:30:00',
    startTime: '15:00',
    endTime: '16:30',
    duration: 90,
    price: 200,
    status: 'confirmed',
    payment_status: 'Paid in Full',
    paymentStatus: 'Paid in Full',
    deliverables: [
      { type: 'Mastered Track', quantity: 1 },
      { type: 'WAV Export', quantity: 1 },
      { type: 'MP3 Export', quantity: 1 },
    ],
    tasks: [
      { id: 't5a', status: 'Ready to Send', assigned_to: 'e3' },
    ],
  },
]

// Payment statuses
export const PAYMENT_STATUSES = ['Paid in Full', 'Deposit Paid', 'Unpaid', 'Refunded'] as const
export type PaymentStatus = typeof PAYMENT_STATUSES[number]
