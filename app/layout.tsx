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
  title: 'CliniQ — L\'instinct absolu.',
  description: 'La plateforme de simulation clinique pour les étudiants en médecine francophones. Un cas par jour, raisonnement diagnostique guidé, préparation ECOSs.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CliniQ',
  },
  keywords: ['médecine', 'ECOS', 'OSCE', 'cas clinique', 'diagnostic', 'étudiants médecine', 'francophone', 'raisonnement clinique'],
  authors: [{ name: 'CliniQ' }],
  openGraph: {
    title: 'CliniQ — L\'instinct absolu.',
    description: 'Simulation clinique · Raisonnement diagnostique · Préparation ECOSs. Un cas par jour, gratuit, en français.',
    url: 'https://cliniq-blond-nu.vercel.app',
    siteName: 'CliniQ',
    images: [
      {
        url: '/og-image-brand.jpg',
        width: 1200,
        height: 675,
        alt: 'CliniQ — L\'instinct absolu. Simulation clinique pour étudiants en médecine.',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CliniQ — L\'instinct absolu.',
    description: 'Simulation clinique · Raisonnement diagnostique · Préparation ECOSs.',
    images: ['/og-image-brand.jpg'],
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
