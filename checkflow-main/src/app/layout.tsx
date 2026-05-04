import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Pentagon CheckFlow',
  description: 'Studio Operating System — The Pentagon',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-surface text-white antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
