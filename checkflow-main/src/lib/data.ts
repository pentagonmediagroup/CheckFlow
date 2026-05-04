export const SESSIONS = [
  { id: 's1', client: 'The Midnight Echoes', type: 'Recording Session', date: 'May 10', time: '10:00 AM', status: 'Paid in Full', engineer: 'A', room: 'Studio A' },
  { id: 's2', client: 'Sarah Connelly',      type: 'Vocal Booth',       date: 'May 10', time: '1:00 PM',  status: 'Paid in Full', engineer: 'A', room: 'Vocal Booth' },
  { id: 's3', client: 'Neon Wave Band',      type: 'Band Rehearsal',    date: 'May 11', time: '2:00 PM',  status: 'Paid in Full', engineer: 'B', room: 'Studio B' },
  { id: 's4', client: 'DJ Pulse',            type: 'Mixing',            date: 'May 12', time: '11:00 AM', status: 'Unpaid',       engineer: 'A', room: 'Mix Suite' },
  { id: 's5', client: 'The Midnight Echoes', type: 'Mastering',         date: 'Apr 27', time: '3:00 PM',  status: 'Paid in Full', engineer: 'B', room: 'Mastering' },
]

export const TASKS = [
  { id: 't1', client: 'The Midnight Echoes', type: 'Recording Session', stage: 'Recording Complete', color: '#93C5FD' },
  { id: 't2', client: 'The Midnight Echoes', type: 'Recording Session', stage: 'QC Check',           color: '#FDE047' },
  { id: 't3', client: 'Sarah Connelly',      type: 'Vocal Booth',       stage: 'Setup',              color: '#C084FC' },
  { id: 't4', client: 'Neon Wave Band',      type: 'Band Rehearsal',    stage: 'Editing',            color: '#FCA5A5' },
  { id: 't5', client: 'DJ Pulse',            type: 'Mixing',            stage: 'File Naming',        color: '#6EE7B7' },
  { id: 't6', client: 'DJ Pulse',            type: 'Mixing',            stage: 'Upload',             color: '#FCD34D' },
  { id: 't7', client: 'The Midnight Echoes', type: 'Mastering',         stage: 'Ready to Send',      color: '#DDD6FE' },
]

export const CLIENTS = [
  { id: 'c1', name: 'The Midnight Echoes', type: 'Band',   sessions: 3, balance: '$0',    status: 'Active' },
  { id: 'c2', name: 'Sarah Connelly',      type: 'Solo',   sessions: 1, balance: '$0',    status: 'Active' },
  { id: 'c3', name: 'Neon Wave Band',      type: 'Band',   sessions: 2, balance: '$0',    status: 'Active' },
  { id: 'c4', name: 'DJ Pulse',            type: 'DJ/Producer', sessions: 2, balance: '$120', status: 'Unpaid' },
]

export const STAFF = [
  { id: 'e1', name: 'Marcus Webb',    role: 'Senior Engineer', status: 'Available', sessions: 12 },
  { id: 'e2', name: 'Jordan Lee',     role: 'Mix Engineer',    status: 'In Session', sessions: 8  },
  { id: 'e3', name: 'Priya Sharma',   role: 'Mastering Eng',  status: 'Available', sessions: 5  },
  { id: 'e4', name: 'Devon Torres',   role: 'Assistant Eng',  status: 'Off Duty',  sessions: 3  },
]

export const CASHFLOW_MONTHS = [
  { month: 'Dec', revenue: 3800, collected: 3800 },
  { month: 'Jan', revenue: 5200, collected: 4900 },
  { month: 'Feb', revenue: 4500, collected: 4500 },
  { month: 'Mar', revenue: 6800, collected: 6200 },
  { month: 'Apr', revenue: 5800, collected: 5680 },
  { month: 'May', revenue: 580,  collected: 460  },
]
