import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uxxilsmxwbqefjsfszom.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eGlsc214d2JxZWZqc2Zzem9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDM0NzIsImV4cCI6MjA5MjQ3OTQ3Mn0.PdWxybcEUyBMHQWU5DoeNcSZJeKr7hW35TCHiPv7YkA'

export const supabase = createClient(url, key)
