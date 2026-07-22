'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AuthButton from '@/app/components/AuthButton'
import ShareCard from '@/app/components/ShareCard'

type GameSession = {
  id: string
  created_at: string
  attempts: number
  result: 'won' | 'lost'
  cases: {
    title: string
    specialty: string
    diagnosis_exact: string
  }
}

export default function ProfileClient() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    fetchData()
    const localStreak = parseInt(localStorage.getItem('currentStreak') || '0')
    setStreak(localStreak)
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*, cases(title, specialty, diagnosis_exact)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setSessions(data as unknown as GameSession[])
        } else if (error) {
          console.error('Profile fetch error:', error)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = sessions.length
    const won = sessions.filter(s => s.result === 'won').length
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0

    const wonSessions = sessions.filter(s => s.result === 'won')
    const avgAttempts = won > 0
      ? (wonSessions.reduce((acc, s) => acc + s.attempts, 0) / won).toFixed(1)
      : '-'

    // Specialty breakdown
    const specialtyStats: Record<string, { total: number; won: number }> = {}
    sessions.forEach(s => {
      const spec = s.cases?.specialty || 'Autre'
      if (!specialtyStats[spec]) specialtyStats[spec] = { total: 0, won: 0 }
      specialtyStats[spec].total++
      if (s.result === 'won') specialtyStats[spec].won++
    })

    const specialtyList = Object.entries(specialtyStats)
      .map(([specialty, data]) => ({
        specialty,
        total: data.total,
        won: data.won,
        winRate: Math.round((data.won / data.total) * 100),
      }))
      .sort((a, b) => b.winRate - a.winRate)

    const bestSpecialty = specialtyList[0]?.specialty || ''

    return { total, won, winRate, avgAttempts, specialtyList, bestSpecialty }
  }, [sessions])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#0066CC] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const card = "bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 mb-6"

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="flex items-center justify-between mb-8 px-2">
          <Link href="/" className="text-[#0066CC] flex items-center gap-2 font-medium hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Cas du jour
          </Link>
        </div>

        <div className={`${card} text-center py-12`}>
          <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-3 tracking-tight">Profil & Statistiques</h2>
          <p className="text-[#6E6E73] mb-8 text-sm leading-relaxed px-4">
            Connectez-vous pour suivre votre progression, analyser vos faiblesses par spécialité et sauvegarder votre historique de cas.
          </p>
          <div className="flex justify-center">
            <AuthButton />
          </div>
        </div>
      </div>
    )
  }

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Clinicien'

  return (
    <div className="max-w-xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8 px-2">
        <Link href="/" className="text-[#0066CC] flex items-center gap-2 font-medium hover:opacity-80 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Cas du jour
        </Link>
        <AuthButton />
      </div>

      <div className="mb-8 px-2">
        <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Vos Statistiques</h1>
        <p className="text-[#86868B]">Analysez vos performances cliniques.</p>
      </div>

      {/* Share Card — always visible if user has played */}
      {stats.total > 0 && (
        <ShareCard
          name={userName}
          overallScore={stats.winRate}
          bestSpecialty={stats.bestSpecialty}
          totalCases={stats.total}
          winRate={stats.winRate}
          streak={streak}
          specialtyList={stats.specialtyList}
        />
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`${card} !mb-0 !p-4 flex flex-col items-center justify-center`}>
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">Cas traités</span>
          <span className="text-2xl font-bold text-[#1D1D1F]">{stats.total}</span>
        </div>
        <div className={`${card} !mb-0 !p-4 flex flex-col items-center justify-center`}>
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">Réussite</span>
          <span className="text-2xl font-bold text-[#0066CC]">{stats.winRate}%</span>
        </div>
        <div className={`${card} !mb-0 !p-4 flex flex-col items-center justify-center`}>
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">Moy. tent.</span>
          <span className="text-2xl font-bold text-[#1D1D1F]">{stats.avgAttempts}</span>
        </div>
      </div>

      {/* Specialty Progress Bars */}
      {stats.specialtyList.length > 0 ? (
        <div className={card}>
          <h2 className="text-[15px] font-bold text-[#1D1D1F] mb-5 flex items-center gap-2">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Taux de réussite par spécialité
          </h2>
          <div className="flex flex-col gap-4">
            {stats.specialtyList.map((spec) => {
              const color = spec.winRate >= 75
                ? '#34C759'
                : spec.winRate >= 40
                ? '#FF9F0A'
                : '#FF3B30'
              const bgColor = spec.winRate >= 75
                ? 'bg-[#F0FDF4]'
                : spec.winRate >= 40
                ? 'bg-[#FFFBEB]'
                : 'bg-[#FEF2F2]'
              return (
                <div key={spec.specialty}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-semibold text-[#1D1D1F]">{spec.specialty}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#AEAEB2]">{spec.total} cas</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${bgColor}`}
                        style={{ color }}
                      >
                        {spec.winRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${spec.winRate}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className={`${card} text-center py-8`}>
          <p className="text-sm text-[#86868B]">Jouez vos premiers cas pour voir vos statistiques par spécialité.</p>
        </div>
      )}

      {/* History */}
      <div className={card}>
        <h2 className="text-[15px] font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="12 8 12 12 14 14" /><circle cx="12" cy="12" r="10" />
          </svg>
          Derniers cas cliniques
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-[#86868B] text-center py-4">Aucun cas traité pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F7]/50 border border-black/5">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${session.result === 'won' ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`} />
                    <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">{session.cases?.specialty}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1D1D1F] truncate">
                    {session.cases?.title || 'Cas mystère'}
                  </p>
                  <p className="text-xs text-[#86868B] mt-0.5 truncate">
                    {session.cases?.diagnosis_exact}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-medium text-[#86868B]">
                    {new Date(session.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md mt-1 ${
                    session.result === 'won' ? 'bg-[#E8F8EE] text-[#166534]' : 'bg-[#FEECEB] text-[#B91C1C]'
                  }`}>
                    {session.result === 'won' ? `${session.attempts} tent.` : 'Échec'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
