'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Profile = {
  display_name: string
  avatar_url: string
  streak: number
  total_cases_played: number
  last_played: string | null
  created_at: string
}

type Session = {
  id: string
  case_id: string
  result: 'won' | 'lost'
  attempts: number
  played_at: string
  cases: {
    title: string
    specialty: string
    diagnosis_exact: string
  } | null
}

const specialtyColors: Record<string, string> = {
  'Cardiologie':      '#FF3B30',
  'Neurologie':       '#5856D6',
  'Pneumologie':      '#007AFF',
  'Gastroentérologie':'#34C759',
  'Infectiologie':    '#FF9500',
  'Urgences':         '#FF2D55',
  'Réanimation':      '#AF52DE',
  'Pédiatrie':        '#32ADE6',
}

function getSpecialtyColor(specialty: string) {
  return specialtyColors[specialty] || '#AEAEB2'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [notLoggedIn, setNotLoggedIn] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setNotLoggedIn(true)
      setLoading(false)
      return
    }

    const [profileRes, sessionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('game_sessions')
        .select('id, case_id, result, attempts, played_at, cases(title, specialty, diagnosis_exact)')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(50),
    ])

    setProfile(profileRes.data)
    setSessions((sessionsRes.data || []) as Session[])
    setLoading(false)
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (notLoggedIn) {
    return (
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Header />
          <div className="bg-white rounded-2xl border border-[#E8E8ED] p-8 text-center mt-8">
            <div className="w-14 h-14 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto mb-4 text-2xl">
              👤
            </div>
            <p className="text-[15px] font-semibold text-[#1D1D1F] mb-1">Connectez-vous pour voir votre profil</p>
            <p className="text-sm text-[#6E6E73] mb-5">Votre historique et vos statistiques sont sauvegardés après connexion.</p>
            <button
              onClick={() => supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback` },
              })}
              className="inline-flex items-center gap-2 bg-[#0066CC] text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-[#0055AA] transition-colors"
            >
              Continuer avec Google
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Header />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#E8E8ED] h-20 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── Computed stats ─────────────────────────────────────────────────────────
  const wonCount = sessions.filter(s => s.result === 'won').length
  const winRate = sessions.length > 0 ? Math.round((wonCount / sessions.length) * 100) : 0
  const avgAttempts = sessions.length > 0
    ? (sessions.reduce((acc, s) => acc + s.attempts, 0) / sessions.length).toFixed(1)
    : '—'

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Header />

        {/* ── Avatar + Name ── */}
        <div className="flex items-center gap-4 mb-6">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} className="w-14 h-14 rounded-full border border-[#E8E8ED]" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#EBF4FF] border border-[#C7DEFF] flex items-center justify-center text-xl font-semibold text-[#0066CC]">
              {profile?.display_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[17px] font-semibold text-[#1D1D1F]">{profile?.display_name}</p>
            <p className="text-sm text-[#AEAEB2]">
              Membre depuis {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard value={`🔥 ${profile?.streak ?? 0}`} label="Série actuelle" />
          <StatCard value={`${winRate}%`} label="Taux de réussite" highlight={winRate >= 70} />
          <StatCard value={String(profile?.total_cases_played ?? sessions.length)} label="Cas joués" />
        </div>

        {/* ── Secondary stats ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard value={`${wonCount} / ${sessions.length}`} label="Réussis / Joués" />
          <StatCard value={avgAttempts} label="Tentatives en moyenne" />
        </div>

        {/* ── History ── */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#AEAEB2] mb-3">Historique</p>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E8ED] p-6 text-center">
            <p className="text-sm text-[#AEAEB2]">Aucun cas joué pour l'instant.</p>
            <Link href="/" className="inline-block mt-3 text-sm font-medium text-[#0066CC]">Jouer le cas du jour →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}

        {/* ── Back link ── */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-[#AEAEB2] hover:text-[#6E6E73] transition-colors">
            ← Retour au cas du jour
          </Link>
        </div>
      </div>
    </main>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Header() {
  return (
    <div className="flex justify-between items-center mb-8">
      <Link href="/">
        <span className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">Clin</span>
        <span className="text-[17px] font-semibold tracking-tight text-[#0066CC]">IQ</span>
      </Link>
      <p className="text-[11px] text-[#AEAEB2] font-medium uppercase tracking-wider">Profil</p>
    </div>
  )
}

function StatCard({ value, label, highlight = false }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8ED] p-4 text-center">
      <p className={`text-[20px] font-semibold tracking-tight mb-0.5 ${highlight ? 'text-[#0066CC]' : 'text-[#1D1D1F]'}`}>
        {value}
      </p>
      <p className="text-[11px] text-[#AEAEB2]">{label}</p>
    </div>
  )
}

function SessionCard({ session }: { session: Session }) {
  const caseInfo = session.cases
  const isWon = session.result === 'won'
  const date = new Date(session.played_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  const color = caseInfo?.specialty ? getSpecialtyColor(caseInfo.specialty) : '#AEAEB2'

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8ED] px-4 py-3.5 flex items-center gap-4">
      {/* Result badge */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
        isWon
          ? 'bg-[#F0FDF4] text-[#166534]'
          : 'bg-[#FEF2F2] text-[#B91C1C]'
      }`}>
        {isWon ? '✓' : '×'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#1D1D1F] truncate">
          {caseInfo?.diagnosis_exact || session.case_id}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {caseInfo?.specialty && (
            <span className="text-[10px] font-medium" style={{ color }}>
              {caseInfo.specialty}
            </span>
          )}
          <span className="text-[10px] text-[#AEAEB2]">·</span>
          <span className="text-[10px] text-[#AEAEB2]">{date}</span>
        </div>
      </div>

      {/* Attempts */}
      <div className="text-right flex-shrink-0">
        <p className="text-[13px] font-semibold text-[#1D1D1F]">
          {isWon ? session.attempts : '—'}
        </p>
        <p className="text-[10px] text-[#AEAEB2]">
          {isWon ? `tentative${session.attempts > 1 ? 's' : ''}` : 'non trouvé'}
        </p>
      </div>
    </div>
  )
}
