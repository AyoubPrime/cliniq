import { supabase } from '@/lib/supabase'
import GameBoard from './components/GameBoard'
import WelcomeScreen from './components/WelcomeScreen'

async function getTodayCase() {
  const today = new Date().toISOString().split('T')[0]

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