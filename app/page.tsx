import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import GameBoard from './components/GameBoard'
import WelcomeScreen from './components/WelcomeScreen'

import { getAlgiersDateString } from '@/lib/date'

async function getTodayCase() {
  const today = getAlgiersDateString()

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('status', 'published')
    .lte('publish_date', today)
    .order('publish_date', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

export async function generateMetadata(): Promise<Metadata> {
  const cas = await getTodayCase()

  if (!cas) return {}

  const sex = cas.sex === 'M' ? 'masculin' : 'féminin'
  const description = `Patient de ${cas.age} ans (${sex}), ${cas.setting}. Motif : ${cas.chief_complaint}. Analysez les indices et posez le bon diagnostic.`

  return {
    title: `ClinIQ — Cas du jour · ${cas.specialty}`,
    description,
    openGraph: {
      title: `ClinIQ — Cas du jour · ${cas.specialty}`,
      description,
      images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `ClinIQ — Cas du jour · ${cas.specialty}`,
      description,
      images: ['/og-image.jpg'],
    },
  }
}

export const revalidate = 3600

export default async function Home() {
  const cas = await getTodayCase()

  if (!cas) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#AEAEB2]">Aucun cas disponible aujourd'hui.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <WelcomeScreen />
      <GameBoard cas={cas} />
    </main>
  )
}
