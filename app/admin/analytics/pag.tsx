import { supabase } from '@/lib/supabase'

async function getAnalytics() {
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalEvents },
    { count: casesStarted7d },
    { count: casesCompleted7d },
    { count: casesWon7d },
    { data: recentEvents },
    { data: caseStats },
    { count: totalProfiles },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('event_type', 'case_started')
      .gte('created_at', sevenDaysAgo),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('event_type', 'case_completed')
      .gte('created_at', sevenDaysAgo),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('event_type', 'case_completed')
      .eq('metadata->>result', 'won')
      .gte('created_at', sevenDaysAgo),
    supabase.from('events').select('event_type, case_id, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('events').select('case_id, metadata')
      .eq('event_type', 'case_completed')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const casePerformance: Record<string, { started: number; won: number; lost: number; totalAttempts: number }> = {}
  caseStats?.forEach(e => {
    const id = e.case_id || 'unknown'
    if (!casePerformance[id]) casePerformance[id] = { started: 0, won: 0, lost: 0, totalAttempts: 0 }
    if (e.metadata?.result === 'won') casePerformance[id].won++
    if (e.metadata?.result === 'lost') casePerformance[id].lost++
    if (e.metadata?.attempts) casePerformance[id].totalAttempts += e.metadata.attempts
  })

  return {
    totalEvents: totalEvents || 0,
    casesStarted7d: casesStarted7d || 0,
    casesCompleted7d: casesCompleted7d || 0,
    casesWon7d: casesWon7d || 0,
    winRate7d: casesCompleted7d ? Math.round((casesWon7d || 0) / casesCompleted7d * 100) : 0,
    recentEvents: recentEvents || [],
    casePerformance,
    totalProfiles: totalProfiles || 0,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalytics()

  const card = 'bg-white rounded-2xl border border-gray-100 p-5 mb-4'
  const label = 'text-xs font-medium uppercase tracking-wide text-gray-400 mb-3 block'

  const eventLabel: Record<string, string> = {
    case_started: 'Cas ouvert',
    case_completed: 'Cas terminé',
    guess_submitted: 'Tentative',
    account_created: 'Compte créé',
    share_clicked: 'Partage',
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-xl font-semibold text-gray-900">Clin</span>
            <span className="text-xl font-semibold text-blue-600">IQ</span>
            <p className="text-sm text-gray-400 mt-0.5">Analytics</p>
          </div>
          <a href="/admin" className="text-sm text-gray-400 hover:text-gray-600">
            ← Admin
          </a>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={card + ' mb-0'}>
            <p className="text-xs text-gray-400 mb-1">Comptes créés</p>
            <p className="text-2xl font-semibold text-gray-900">{data.totalProfiles}</p>
          </div>
          <div className={card + ' mb-0'}>
            <p className="text-xs text-gray-400 mb-1">Cas ouverts (7j)</p>
            <p className="text-2xl font-semibold text-gray-900">{data.casesStarted7d}</p>
          </div>
          <div className={card + ' mb-0'}>
            <p className="text-xs text-gray-400 mb-1">Cas terminés (7j)</p>
            <p className="text-2xl font-semibold text-gray-900">{data.casesCompleted7d}</p>
          </div>
          <div className={card + ' mb-0'}>
            <p className="text-xs text-gray-400 mb-1">Taux de réussite (7j)</p>
            <p className="text-2xl font-semibold text-gray-900">{data.winRate7d}%</p>
          </div>
        </div>

        {/* Case performance */}
        {Object.keys(data.casePerformance).length > 0 && (
          <div className={card}>
            <p className={label}>Performance par cas (30j)</p>
            <div className="flex flex-col gap-2">
              {Object.entries(data.casePerformance)
                .sort((a, b) => (b[1].won + b[1].lost) - (a[1].won + a[1].lost))
                .slice(0, 10)
                .map(([caseId, stats]) => {
                  const total = stats.won + stats.lost
                  const winRate = total ? Math.round(stats.won / total * 100) : 0
                  const avgAttempts = total ? (stats.totalAttempts / total).toFixed(1) : '—'
                  return (
                    <div key={caseId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{caseId}</p>
                        <p className="text-xs text-gray-400">{total} parties · {avgAttempts} tentatives moy.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-400 rounded-full"
                            style={{ width: `${winRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 min-w-[30px] text-right">{winRate}%</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className={card}>
          <p className={label}>Activité récente</p>
          <div className="flex flex-col gap-0">
            {data.recentEvents.map((event, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    event.event_type === 'case_completed' && event.metadata?.result === 'won'
                      ? 'bg-green-400'
                      : event.event_type === 'case_completed'
                      ? 'bg-red-400'
                      : event.event_type === 'case_started'
                      ? 'bg-blue-400'
                      : 'bg-gray-300'
                  }`} />
                  <p className="text-xs text-gray-700">
                    {eventLabel[event.event_type] || event.event_type}
                    {event.case_id && <span className="text-gray-400"> · {event.case_id}</span>}
                  </p>
                </div>
                <p className="text-xs text-gray-300">
                  {new Date(event.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-300">Total événements enregistrés: {data.totalEvents}</p>
        </div>
      </div>
    </main>
  )
}