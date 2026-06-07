import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Typewise Radar — Community Intent Monitor',
  description: 'AI-powered Reddit monitoring for CS buyer intent signals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
