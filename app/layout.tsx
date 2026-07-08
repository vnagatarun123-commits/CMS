import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PuraLocal CMS',
  description: 'Hyperlocal News CMS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="h-full">
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
