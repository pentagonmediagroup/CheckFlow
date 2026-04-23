export const MOCK_EMPLOYEES = [
  { id: '1', name: 'Jordan Williams' },
  { id: '2', name: 'Marcus Davis' },
  { id: '3', name: 'Tasha Brown' },
]

export const STUDIO_A_SERVICES = [
  'RipDaMic Session',
  'Recording Hourly Session',
]

export const STUDIO_B_SERVICES = [
  'Interview (Multi-Cam)',
  'Podcast (Multi-Cam)',
  'Podcast (Audio Only)',
]

export const TASK_STAGES = [
  'Setup',
  'Recording Complete',
  'QC Check',
  'File Naming',
  'Upload',
  'Editing',
  'Ready to Send',
  'Delivered',
]

export const PAYMENT_STATUSES = [
  'Deposit Paid',
  'Balance Due',
  'Paid in Full',
]

export const SERVICE_PRICING: Record<string, number> = {
  'RipDaMic Session': 150,
  'Recording Hourly Session': 75,
  'Interview (Multi-Cam)': 300,
  'Podcast (Multi-Cam)': 250,
  'Podcast (Audio Only)': 150,
}

export const MOCK_SESSIONS = [
  {
    id: 'mock-1',
    client_id: 'c1',
    employee_id: '1',
    studio: 'Studio A',
    service: 'RipDaMic Session',
    start_time: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    buffer_end_time: new Date(Date.now() + 86400000 + 9000000).toISOString(),
    payment_status: 'Deposit Paid',
    notes: 'First session for EP project',
    clients: { name: 'Lil Dre', phone: '404-555-0101', email: 'dre@email.com', ig: '@lildre' },
    employees: { name: 'Jordan Williams' },
    deliverables: [{ type: 'Full Video', quantity: 1 }, { type: 'Social Clips', quantity: 3 }],
    tasks: [{ id: 't1', status: 'Setup', assigned_to: '1' }],
  },
  {
    id: 'mock-2',
    client_id: 'c2',
    employee_id: '2',
    studio: 'Studio B',
    service: 'Podcast (Multi-Cam)',
    start_time: new Date(Date.now() + 172800000).toISOString(),
    end_time: new Date(Date.now() + 172800000 + 5400000).toISOString(),
    buffer_end_time: new Date(Date.now() + 172800000 + 7200000).toISOString(),
    payment_status: 'Paid in Full',
    notes: 'Tech talk podcast ep 5',
    clients: { name: 'TechTalk Media', phone: '770-555-0202', email: 'info@techtalk.com', ig: '@techtalkmedia' },
    employees: { name: 'Marcus Davis' },
    deliverables: [{ type: 'Full Video', quantity: 1 }, { type: 'Audio Bounce', quantity: 1 }],
    tasks: [{ id: 't2', status: 'Editing', assigned_to: '2' }],
  },
  {
    id: 'mock-3',
    client_id: 'c3',
    employee_id: '3',
    studio: 'Studio A',
    service: 'Recording Hourly Session',
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    buffer_end_time: new Date(Date.now() - 86400000 + 5400000).toISOString(),
    payment_status: 'Paid in Full',
    notes: '',
    clients: { name: 'Young Nova', phone: '678-555-0303', email: 'nova@email.com', ig: '@youngnova' },
    employees: { name: 'Tasha Brown' },
    deliverables: [{ type: 'Audio Bounce', quantity: 1 }],
    tasks: [{ id: 't3', status: 'Ready to Send', assigned_to: '3' }],
  },
]

export const MOCK_CLIENTS = [
  { id: 'c1', name: 'Lil Dre', phone: '404-555-0101', email: 'dre@email.com', ig: '@lildre' },
  { id: 'c2', name: 'TechTalk Media', phone: '770-555-0202', email: 'info@techtalk.com', ig: '@techtalkmedia' },
  { id: 'c3', name: 'Young Nova', phone: '678-555-0303', email: 'nova@email.com', ig: '@youngnova' },
  { id: 'c4', name: 'Aria Beats', phone: '404-555-0404', email: 'aria@beats.com', ig: '@ariabeats' },
]
