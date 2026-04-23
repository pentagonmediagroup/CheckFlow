// Services - arrays of strings (service names)
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

// Task stages for kanban board
export const TASK_STAGES = ['To Do', 'In Progress', 'Review', 'Done'] as const

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
    totalSessions: 12,
    totalSpend: 3200,
    lastVisit: '2026-04-10',
  },
  {
    id: 'c2',
    name: 'Sarah Connelly',
    email: 'sarah@example.com',
    phone: '555-0102',
    totalSessions: 5,
    totalSpend: 950,
    lastVisit: '2026-04-15',
  },
  {
    id: 'c3',
    name: 'Neon Wave Band',
    email: 'neonwave@example.com',
    phone: '555-0103',
    totalSessions: 8,
    totalSpend: 2100,
    lastVisit: '2026-04-18',
  },
  {
    id: 'c4',
    name: 'DJ Pulse',
    email: 'djpulse@example.com',
    phone: '555-0104',
    totalSessions: 20,
    totalSpend: 5500,
    lastVisit: '2026-04-20',
  },
]

// Sessions
export const MOCK_SESSIONS = [
  {
    id: 's1',
    clientId: 'c1',
    clientName: 'The Midnight Echoes',
    service: 'Recording Session',
    studio: 'A',
    engineer: 'Alex Johnson',
    date: '2026-04-24',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    price: 150,
    status: 'confirmed',
    paymentStatus: 'paid',
  },
  {
    id: 's2',
    clientId: 'c2',
    clientName: 'Sarah Connelly',
    service: 'Vocal Booth',
    studio: 'A',
    engineer: 'Jamie Lee',
    date: '2026-04-24',
    startTime: '13:00',
    endTime: '14:00',
    duration: 60,
    price: 100,
    status: 'confirmed',
    paymentStatus: 'pending',
  },
  {
    id: 's3',
    clientId: 'c3',
    clientName: 'Neon Wave Band',
    service: 'Band Rehearsal',
    studio: 'B',
    engineer: 'Taylor Brown',
    date: '2026-04-25',
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    price: 180,
    status: 'confirmed',
    paymentStatus: 'paid',
  },
  {
    id: 's4',
    clientId: 'c4',
    clientName: 'DJ Pulse',
    service: 'Mixing',
    studio: 'A',
    engineer: 'Alex Johnson',
    date: '2026-04-26',
    startTime: '11:00',
    endTime: '13:00',
    duration: 120,
    price: 250,
    status: 'pending',
    paymentStatus: 'unpaid',
  },
  {
    id: 's5',
    clientId: 'c1',
    clientName: 'The Midnight Echoes',
    service: 'Mastering',
    studio: 'B',
    engineer: 'Morgan Smith',
    date: '2026-04-27',
    startTime: '15:00',
    endTime: '16:30',
    duration: 90,
    price: 200,
    status: 'confirmed',
    paymentStatus: 'paid',
  },
]

// Payment statuses
export const PAYMENT_STATUSES = ['paid', 'pending', 'unpaid', 'refunded'] as const

export type PaymentStatus = typeof PAYMENT_STATUSES[number]
