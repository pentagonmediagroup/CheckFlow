// Services
export const STUDIO_A_SERVICES = ['Recording Session','Mixing','Mastering','Vocal Booth']
export const STUDIO_B_SERVICES = ['Recording Session','Podcast Recording','Voice Over','Band Rehearsal']
export const SERVICE_PRICING: Record<string, number> = {
  'Recording Session': 150, 'Mixing': 250, 'Mastering': 200,
  'Vocal Booth': 100, 'Podcast Recording': 100, 'Voice Over': 75, 'Band Rehearsal': 180,
}

export const TASK_STAGES = [
  'Setup','Recording Complete','QC Check','File Naming','Upload','Editing','Ready to Send','Delivered'
] as const
export type TaskStage = typeof TASK_STAGES[number]

export const EMPLOYEE_ROLES = [
  'Sales','Editor','Executive Asst.','Camera Man','Lighting',
  'Director','Creative Director','Marketing','Social Media','Intern',
  'Sound Engineer','Producer','Mixing Engineer','Mastering Engineer',
] as const
export type EmployeeRole = typeof EMPLOYEE_ROLES[number]

export const PAYMENT_STATUSES = [
  'Deposit Paid','Balance Due','Paid in Full','Rescheduled','Late Fee Applied','Cancelled'
] as const
export type PaymentStatus = typeof PAYMENT_STATUSES[number]

export const MOCK_EMPLOYEES = [
  { id: 'e1', name: 'Alex Johnson', role: 'Sound Engineer' as EmployeeRole, studio: 'A', available: true },
  { id: 'e2', name: 'Jamie Lee', role: 'Editor' as EmployeeRole, studio: 'A', available: true },
  { id: 'e3', name: 'Morgan Smith', role: 'Director' as EmployeeRole, studio: 'B', available: false },
  { id: 'e4', name: 'Taylor Brown', role: 'Sales' as EmployeeRole, studio: 'B', available: true },
]

export const MOCK_CLIENTS = [
  { id: 'c1', name: 'The Midnight Echoes', email: 'contact@midnightechoes.com', phone: '555-0101', ig: '@midnightechoes', total_sessions: 12, total_spend: 3200, last_visit: '2026-04-10', salesperson_id: 'e4' },
  { id: 'c2', name: 'Sarah Connelly', email: 'sarah@example.com', phone: '555-0102', ig: '@sarahconnelly', total_sessions: 5, total_spend: 950, last_visit: '2026-04-15', salesperson_id: 'e4' },
  { id: 'c3', name: 'Neon Wave Band', email: 'neonwave@example.com', phone: '555-0103', ig: '@neonwaveband', total_sessions: 8, total_spend: 2100, last_visit: '2026-04-18', salesperson_id: null },
  { id: 'c4', name: 'DJ Pulse', email: 'djpulse@example.com', phone: '555-0104', ig: '@djpulse', total_sessions: 20, total_spend: 5500, last_visit: '2026-04-20', salesperson_id: 'e4' },
]

export const MOCK_SESSIONS = [
  {
    id: 's1', client_id: 'c1',
    clients: { id: 'c1', name: 'The Midnight Echoes', email: 'contact@midnightechoes.com' },
    service: 'Recording Session', studio: 'Studio A',
    start_time: '2026-05-10T10:00:00', end_time: '2026-05-10T11:00:00',
    total_amount: 150, amount_paid: 75, late_fee: 0,
    payment_status: 'Deposit Paid',
    salesperson_id: 'e4',
    deliverables: [{ type: 'Full Video', quantity: 1 }, { type: 'Social Clips', quantity: 3 }],
    tasks: [{ id: 't1', status: 'Setup', assigned_to: 'e1' }],
  },
  {
    id: 's2', client_id: 'c2',
    clients: { id: 'c2', name: 'Sarah Connelly', email: 'sarah@example.com' },
    service: 'Vocal Booth', studio: 'Studio A',
    start_time: '2026-05-10T13:00:00', end_time: '2026-05-10T14:00:00',
    total_amount: 100, amount_paid: 0, late_fee: 0,
    payment_status: 'Balance Due',
    salesperson_id: null,
    deliverables: [{ type: 'Audio Bounce', quantity: 1 }],
    tasks: [{ id: 't2', status: 'Recording Complete', assigned_to: 'e2' }],
  },
  {
    id: 's3', client_id: 'c3',
    clients: { id: 'c3', name: 'Neon Wave Band', email: 'neonwave@example.com' },
    service: 'Band Rehearsal', studio: 'Studio B',
    start_time: '2026-05-11T14:00:00', end_time: '2026-05-11T16:00:00',
    total_amount: 180, amount_paid: 180, late_fee: 0,
    payment_status: 'Paid in Full',
    salesperson_id: 'e4',
    deliverables: [{ type: 'Full Video', quantity: 1 }],
    tasks: [{ id: 't3', status: 'Editing', assigned_to: 'e3' }],
  },
  {
    id: 's4', client_id: 'c4',
    clients: { id: 'c4', name: 'DJ Pulse', email: 'djpulse@example.com' },
    service: 'Mixing', studio: 'Studio A',
    start_time: '2026-05-12T11:00:00', end_time: '2026-05-12T13:00:00',
    total_amount: 250, amount_paid: 0, late_fee: 25,
    payment_status: 'Late Fee Applied',
    salesperson_id: null,
    deliverables: [{ type: 'Audio Bounce', quantity: 2 }],
    tasks: [{ id: 't4', status: 'Ready to Send', assigned_to: 'e1' }],
  },
]
