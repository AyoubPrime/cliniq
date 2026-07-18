import { supabase } from '@/lib/supabase'
import ArchivesClient from './ArchivesClient'
import { getAlgiersDateString } from '@/lib/date'

async function getAllCases() {
  const today = getAlgiersDateString()

  const { data, error } = await supabase
    .from('cases')
    .select('id, title, specialty, difficulty, publish_date, age, age_unit, sex, setting, chief_complaint')
    .eq('status', 'published')
    .lte('publish_date', today)
    .order('publish_date', { ascending: false })

  if (error) return []
  return data
}

export default async function ArchivesPage() {
  const cases = await getAllCases()
  return (
    <main className="min-h-screen py-8 px-4">
      <ArchivesClient cases={cases} />
    </main>
  )
}
