import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://cliniq-blond-nu.vercel.app'),
  title: 'CliniQ — Un cas clinique par jour',
  description: 'Analysez les indices, posez votre diagnostic, apprenez. Un cas clinique par jour pour les étudiants en médecine francophones.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CliniQ',
  },
  openGraph: {
    title: 'CliniQ — Un cas clinique par jour',
    description: 'Analysez les indices, posez votre diagnostic, apprenez. Un cas clinique par jour pour les étudiants en médecine francophones.',
    url: 'https://cliniq-blond-nu.vercel.app',
    siteName: 'ClinIQ',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CliniQ — Un cas clinique par jour',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CliniQ — Un cas clinique par jour',
    description: 'Analysez les indices, posez votre diagnostic, apprenez.',
    images: ['/og-image.jpg'],
  },
}

import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.className}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0066CC" />
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CliniQ" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
