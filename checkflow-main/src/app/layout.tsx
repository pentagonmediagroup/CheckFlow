import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Pentagon CheckFlow',
  description: 'Studio OS — The Pentagon',
  viewport: 'width=device-width,initial-scale=1,viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
