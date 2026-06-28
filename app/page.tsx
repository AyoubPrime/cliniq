import { supabase } from '@/lib/supabase'

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

export default async function Home() {
  const cas = await getTodayCase()

  if (!cas) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Aucun cas disponible aujourd'hui.</p>
      </main>
    )
  }

  const firstClue = cas.clues.find((c: any) => c.auto_reveal === true)

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ClinIQ</h1>
            <p className="text-sm text-gray-400">Cas du jour</p>
          </div>
          <span className="text-sm font-medium text-orange-500">🔥 Série</span>
        </div>

        {/* Patient Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Présentation</p>
              <p className="text-base font-medium text-gray-900">
                {cas.sex === 'F' ? 'Femme' : 'Homme'}, {cas.age} ans
              </p>
            </div>
            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
              {cas.setting}
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-50 pt-3 mb-4">
            {cas.chief_complaint}. {cas.context}
          </p>

          {/* Vitals */}
          <div className="grid grid-cols-4 gap-2 border-t border-gray-50 pt-3">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{cas.bp}</p>
              <p className="text-xs text-gray-400">TA</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{cas.hr}</p>
              <p className="text-xs text-gray-400">FC</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{cas.temp}°</p>
              <p className="text-xs text-gray-400">Temp</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{cas.spo2}%</p>
              <p className="text-xs text-gray-400">SpO2</p>
            </div>
          </div>
        </div>

        {/* Clue */}
        {firstClue && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <p className="text-xs text-gray-400 mb-2">Indice</p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {firstClue.text}
            </p>
          </div>
        )}

        {/* Guess Input */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-3">Votre diagnostic</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Entrez votre diagnostic..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-300"
            />
            <button className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
              Valider
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}