export type Booking = {
  id: string
  title: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  name: string
  email: string
}

export type TimeSlot = {
  id: string
  time: string
  available: boolean
}

export const mockBookings: Booking[] = [
  {
    id: '1',
    title: 'Initial Consultation',
    date: '2026-04-25',
    time: '10:00 AM',
    status: 'confirmed',
    name: 'John Smith',
    email: 'john@example.com',
  },
  {
    id: '2',
    title: 'Follow-up Meeting',
    date: '2026-04-26',
    time: '2:00 PM',
    status: 'pending',
    name: 'Jane Doe',
    email: 'jane@example.com',
  },
  {
    id: '3',
    title: 'Project Review',
    date: '2026-04-27',
    time: '11:00 AM',
    status: 'confirmed',
    name: 'Bob Johnson',
    email: 'bob@example.com',
  },
]

export const mockTimeSlots: TimeSlot[] = [
  { id: '1', time: '9:00 AM', available: true },
  { id: '2', time: '10:00 AM', available: false },
  { id: '3', time: '11:00 AM', available: true },
  { id: '4', time: '12:00 PM', available: true },
  { id: '5', time: '1:00 PM', available: false },
  { id: '6', time: '2:00 PM', available: true },
  { id: '7', time: '3:00 PM', available: true },
  { id: '8', time: '4:00 PM', available: false },
]
