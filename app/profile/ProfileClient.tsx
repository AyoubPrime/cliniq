'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AuthButton from '@/app/components/AuthButton'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

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

  useEffect(() => {
    fetchData()
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

    // Radar chart data
    const specialtyStats: Record<string, { total: number, won: number }> = {}
    sessions.forEach(s => {
      const spec = s.cases?.specialty || 'Autre'
      if (!specialtyStats[spec]) specialtyStats[spec] = { total: 0, won: 0 }
      specialtyStats[spec].total++
      if (s.result === 'won') specialtyStats[spec].won++
    })

    const radarData = Object.entries(specialtyStats).map(([specialty, data]) => {
      // Shorten specialty names for the chart
      const shortSpec = specialty.length > 10 ? specialty.substring(0, 10) + '...' : specialty
      return {
        subject: shortSpec,
        A: Math.round((data.won / data.total) * 100),
        fullMark: 100,
      }
    })

    return { total, won, winRate, avgAttempts, radarData }
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
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour au jeu
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

  return (
    <div className="max-w-xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8 px-2">
        <Link href="/" className="text-[#0066CC] flex items-center gap-2 font-medium hover:opacity-80 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour au jeu
        </Link>
        <AuthButton />
      </div>

      <div className="mb-8 px-2">
        <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Vos Statistiques</h1>
        <p className="text-[#86868B]">Analysez vos performances cliniques.</p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`${card} !mb-0 !p-4 flex flex-col items-center justify-center`}>
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">Cas joués</span>
          <span className="text-2xl font-bold text-[#1D1D1F]">{stats.total}</span>
        </div>
        <div className={`${card} !mb-0 !p-4 flex flex-col items-center justify-center`}>
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">Taux de réussite</span>
          <span className="text-2xl font-bold text-[#0066CC]">{stats.winRate}%</span>
        </div>
        <div className={`${card} !mb-0 !p-4 flex flex-col items-center justify-center`}>
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">Tentatives moy.</span>
          <span className="text-2xl font-bold text-[#1D1D1F]">{stats.avgAttempts}</span>
        </div>
      </div>

      {/* Radar Chart */}
      {stats.radarData.length > 2 ? (
        <div className={card}>
          <h2 className="text-[15px] font-bold text-[#1D1D1F] mb-6 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Taux de réussite par spécialité
          </h2>
          <div className="w-full h-[300px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                <PolarGrid stroke="#E8E8ED" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#86868B', fontSize: 11, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Réussite %" dataKey="A" stroke="#0066CC" fill="#0066CC" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className={`${card} text-center py-8`}>
          <p className="text-sm text-[#86868B]">Jouez à au moins 3 spécialités différentes pour débloquer votre graphe de compétences.</p>
        </div>
      )}

      {/* History */}
      <div className={card}>
        <h2 className="text-[15px] font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="12 8 12 12 14 14"/><circle cx="12" cy="12" r="10"/>
          </svg>
          Derniers cas cliniques
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-[#86868B] text-center py-4">Aucun cas joué pour le moment.</p>
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
