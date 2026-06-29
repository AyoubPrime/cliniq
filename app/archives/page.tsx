import { supabase } from '@/lib/supabase'
import Link from 'next/link'

async function getAllCases() {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('cases')
    .select('id, title, specialty, difficulty, publish_date, age, sex, setting, chief_complaint')
    .eq('status', 'published')
    .lte('publish_date', today)
    .order('publish_date', { ascending: false })

  if (error) return []
  return data
}

export default async function ArchivesPage() {
  const cases = await getAllCases()

  const difficultyLabel = (d: number) => {
    if (d === 1) return { text: 'Facile', class: 'bg-green-50 text-green-700 border-green-200' }
    if (d === 2) return { text: 'Moyen', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
    return { text: 'Difficile', class: 'bg-red-50 text-red-700 border-red-200' }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ClinIQ</h1>
            <p className="text-sm text-gray-400">Archives — {cases.length} cas</p>
          </div>
          <Link
            href="/"
            className="text-sm text-blue-600 font-medium"
          >
            Cas du jour
          </Link>
        </div>

        {cases.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">Aucun cas disponible.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {cases.map((cas) => {
            const diff = difficultyLabel(cas.difficulty)
            return (
              <Link key={cas.id} href={`/archives/${cas.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{cas.specialty}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {cas.sex === 'F' ? 'Femme' : 'Homme'}, {cas.age} ans — {cas.setting}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${diff.class}`}>
                      {diff.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                    {cas.chief_complaint}
                  </p>
                  <p className="text-xs text-gray-300 mt-2">
                    {new Date(cas.publish_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </main>
  )
}