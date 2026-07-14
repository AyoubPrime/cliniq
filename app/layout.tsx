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
  title: 'ClinIQ — Un cas clinique par jour',
  description: 'Analysez les indices, posez votre diagnostic, apprenez. Un cas clinique par jour pour les étudiants en médecine francophones.',
  openGraph: {
    title: 'ClinIQ — Un cas clinique par jour',
    description: 'Analysez les indices, posez votre diagnostic, apprenez. Un cas clinique par jour pour les étudiants en médecine francophones.',
    url: 'https://cliniq-blond-nu.vercel.app',
    siteName: 'ClinIQ',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ClinIQ — Un cas clinique par jour',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClinIQ — Un cas clinique par jour',
    description: 'Analysez les indices, posez votre diagnostic, apprenez.',
    images: ['/og-image.jpg'],
  },
}

import { Analytics } from '@vercel/analytics/next'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.className}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}