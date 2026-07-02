import { supabase } from '@/lib/supabase'
import GameBoard from './components/GameBoard'

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
        <p className="text-gray-500">Aucun cas disponible aujourd'hui.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <GameBoard cas={cas} />
    </main>
  )
}