'use client'

import { useState, useEffect, useRef } from 'react'
import { DIAGNOSES, ABBREVIATIONS } from '@/lib/diagnoses'
import { supabase } from '@/lib/supabase'
import AuthButton from './AuthButton'
import DiagnosticApproach from './SchemaViewer'
import ReferenceValuesModal from './ReferenceValuesModal'
import SimilarCases from './SimilarCases'

type Clue = {
  id: number
  text: string
  auto_reveal: boolean
}

type Differential = {
  diagnosis: string
  proximity: string
  distinction: string
}

type Case = {
  age: number
  age_unit: string
  sex: string
  setting: string
  specialty: string
  diagnosis_urgency: string
  chief_complaint: string
  context: string
  bp: string
  hr: number
  temp: number
  spo2: number
  clues: Clue[]
  diagnosis_exact: string
  diagnosis_aliases: string[]
  diagnosis_category: string
  wrong_answer_hint: string
  explanation: string
  pearl: string
  red_flags: string[]
  differentials: Differential[]
  management: string[]
  common_mistakes: string[]
  diagnostic_approach?: Array<{
    step: number
    title: string
    detail: string
  }>
  schema_svg?: string
}

type GuessResult = {
  text: string
  result: 'correct' | 'proche' | 'faux'
}

function SaveProgressPrompt({ streak }: { streak: number }) {
  const [user, setUser] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(!!data.user)
    })
  }, [])

  if (user === null || user === true || dismissed) return null

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8ED] p-5 mb-3">
      <p className="text-sm font-semibold text-[#1D1D1F] mb-1">
        Sauvegardez votre progression
      </p>
      <p className="text-xs text-[#6E6E73] mb-4 leading-relaxed">
        Créez un compte pour ne jamais perdre votre série de {streak} jour{streak > 1 ? 's' : ''} et suivre vos progrès sur tous vos appareils.
      </p>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.origin }
            })
          }}
          className="flex-1 bg-[#0066CC] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#0055AA] transition-colors"
        >
          Continuer avec Google
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-4 py-2.5 rounded-xl text-sm text-[#AEAEB2] hover:text-[#6E6E73] transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s]+/g, ' ')
    .trim()
}

function judgeGuess(guess: string, cas: Case): 'correct' | 'proche' | 'faux' {
  const normalizedGuess = normalize(guess)
  const normalizedExact = normalize(cas.diagnosis_exact)
  const normalizedAliases = cas.diagnosis_aliases.map(normalize)

  if (normalizedGuess === normalizedExact || normalizedAliases.includes(normalizedGuess)) {
    return 'correct'
  }

  const guessWords = normalizedGuess.split(' ')
  const exactWords = normalizedExact.split(' ')
  const commonWords = guessWords.filter(w => exactWords.includes(w) && w.length > 3)
  if (commonWords.length >= 1) return 'proche'

  return 'faux'
}

const urgencyColor: Record<string, string> = {
  'Urgence vitale':    'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
  'Urgence différée':  'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
  'Semi-urgent':       'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  'Non urgent':        'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
}

const resultConfig: Record<string, { label: string; icon: string; style: string }> = {
  correct: { label: 'Correct', icon: '✓', style: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' },
  proche:  { label: 'Proche',  icon: '≈', style: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' },
  faux:    { label: 'Faux',    icon: '×', style: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]' },
}

// ─── Badge system ─────────────────────────────────────────────────────────
type Badge = { emoji: string; label: string; color: string; bg: string; border: string }

function getBadge(attempts: number, cluesUsed: number): Badge | null {
  if (attempts === 1 && cluesUsed <= 1)
    return { emoji: '⚡', label: 'INSTINCT ABSOLU', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' }
  if (attempts <= 2)
    return { emoji: '🎯', label: 'PRÉCISION CLINIQUE', color: '#0066CC', bg: '#EBF4FF', border: '#C7DEFF' }
  if (attempts <= 4)
    return { emoji: '🩺', label: 'RAISONNEMENT SOLIDE', color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' }
  return null
}

export default function GameBoard({ cas }: { cas: Case }) {
  const [revealedClues, setRevealedClues] = useState(cas.clues.filter(c => c.auto_reveal))
  const [guesses, setGuesses] = useState<GuessResult[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [showSummary, setShowSummary] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [streak, setStreak] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showRefModal, setShowRefModal] = useState(false)
  const [badge, setBadge] = useState<Badge | null>(null)
  const [showBadge, setShowBadge] = useState(false)
  const startTimeRef = useRef(Date.now())
  const [elapsedSec, setElapsedSec] = useState(0)

  const MAX_ATTEMPTS = 6

  useEffect(() => {
    import('@/lib/date').then(({ getAlgiersDateString }) => {
      const today = getAlgiersDateString()
      const lastVisit = localStorage.getItem('lastVisitDate')
      const currentStreak = parseInt(localStorage.getItem('currentStreak') || '0')
      
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterdayStr = getAlgiersDateString(yesterdayDate)
      
      let newStreak = 1
      if (lastVisit === today) newStreak = currentStreak
      else if (lastVisit === yesterdayStr) newStreak = currentStreak + 1
      else newStreak = 1
      localStorage.setItem('lastVisitDate', today)
      localStorage.setItem('currentStreak', newStreak.toString())
      setStreak(newStreak)
    })
    
    supabase.from('events').insert({
      user_id: null,
      event_type: 'case_started',
      case_id: (cas as any).id || null,
      metadata: null,
    }).then(() => {})
  }, [])

  const suggestions = currentGuess.length >= 2
    ? (() => {
        const upper = currentGuess.toUpperCase().trim()
        const abbrevMatches = ABBREVIATIONS[upper] ? ABBREVIATIONS[upper] : []
        const textMatches = DIAGNOSES.filter(d =>
          normalize(d).includes(normalize(currentGuess)) && !abbrevMatches.includes(d)
        )
        return [...abbrevMatches, ...textMatches].slice(0, 6)
      })()
    : []

  const trackEvent = async (eventType: string, metadata?: object) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('events').insert({
        user_id: user?.id || null,
        event_type: eventType,
        case_id: (cas as any).id || null,
        metadata: metadata || null,
      })
    } catch (e) {}
  }

  const saveGameSession = async (result: 'won' | 'lost', attempts: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const caseId = (cas as any).id || null
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase.from('game_sessions').insert({
        user_id: user.id,
        case_id: caseId,
        attempts,
        result,
      })
      
      if (error) {
        console.error('Supabase insert error:', error)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('total_cases_played')
        .eq('id', user.id)
        .single()

      await supabase.from('profiles').update({
        last_played: today,
        total_cases_played: (profile?.total_cases_played || 0) + 1,
      }).eq('id', user.id)

    } catch (e) {}
  }

  const handleGuess = async () => {
    if (!currentGuess.trim() || gameState !== 'playing' || submitting) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 300))
    const result = judgeGuess(currentGuess, cas)
    const newGuess: GuessResult = { text: currentGuess, result }
    const newGuesses = [...guesses, newGuess]
    setGuesses(newGuesses)
    setCurrentGuess('')
    setShowSuggestions(false)
    setSubmitting(false)

    await trackEvent('guess_submitted', {
      guess: currentGuess,
      result,
      attempt_number: newGuesses.length,
    })

    if (result === 'correct') {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
      setElapsedSec(elapsed)
      setRevealedClues(cas.clues)
      setGameState('won')
      const earnedBadge = getBadge(newGuesses.length, revealedClues.length)
      setTimeout(() => {
        setBadge(earnedBadge)
        setShowBadge(true)
      }, 300)
      await trackEvent('case_completed', { result: 'won', attempts: newGuesses.length })
      await saveGameSession('won', newGuesses.length)
      return
    }
    const nextClueIndex = revealedClues.length
    if (nextClueIndex < cas.clues.length) {
      setRevealedClues([...revealedClues, cas.clues[nextClueIndex]])
    }
    if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameState('lost')
      await trackEvent('case_completed', { result: 'lost', attempts: newGuesses.length })
      await saveGameSession('lost', newGuesses.length)
    }
  }

  const handleShare = (won: boolean) => {
    const usedEmojis = guesses.map(g =>
      g.result === 'correct' ? '🟩' : g.result === 'proche' ? '🟨' : '🟥'
    )
    const unusedSlots = Array(MAX_ATTEMPTS - guesses.length).fill('⬜')
    const emojis = [...usedEmojis, ...unusedSlots].join('')
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    const badgeLine = badge ? `${badge.emoji} ${badge.label} (${revealedClues.length}/${cas.clues.length} indices)\n` : ''
    const timeLine = won && elapsedSec > 0 ? `⏱️ Temps: ${elapsedSec}s\n` : ''
    const specialty = cas.specialty ? ` — ${cas.specialty}` : ''
    const shareUrl = `${window.location.href.split('?')[0]}?ref=social`
    const text = won
      ? `🩺 CliniQ${specialty}\n${date}\n${badgeLine}${timeLine}${emojis}\n\nRelevez le défi: ${shareUrl}`
      : `🩺 CliniQ${specialty}\n${date}\nNon trouvé\n${emojis}\n\nRelevez le défi: ${shareUrl}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Design tokens ────────────────────────────────────────────────────────
  const card = 'bg-white rounded-2xl border border-[#E8E8ED] p-5 mb-3'
  const sectionLabel = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-[#AEAEB2] mb-3 block'

  // ─── Summary view ─────────────────────────────────────────────────────────
  if (showSummary) {
    return (
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">Clin</span>
              <span className="text-[17px] font-bold tracking-tight text-[#0066CC]">iQ</span>
              <span className="text-[11px] text-[#AEAEB2] font-medium ml-1.5">— L'instinct absolu</span>
            </div>
            <p className="text-[11px] text-[#AEAEB2] mt-0.5">Résumé du cas</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/profile" className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" title="Mes Statistiques">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </a>
            <button
              onClick={() => handleShare(gameState === 'won')}
              className="flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] border border-[#E8E8ED] rounded-xl px-4 py-2 hover:border-[#D2D2D7] hover:text-[#1D1D1F] transition-all bg-white"
            >
              {copied ? '✓ Copié' : 'Partager'}
            </button>
          </div>
        </div>

        {/* Diagnosis */}
        <div className={card}>
          <span className={sectionLabel}>Diagnostic</span>
          <p className="text-xl font-semibold text-[#1D1D1F] mb-3 tracking-tight leading-snug">{cas.diagnosis_exact}</p>
          <p className="text-sm text-[#6E6E73] leading-relaxed">{cas.explanation}</p>
          {cas.schema_svg && (
            <div 
              className="mt-4 flex justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-xs"
              dangerouslySetInnerHTML={{ __html: cas.schema_svg }} 
            />
          )}
        </div>

        {/* Diagnostic approach */}
        {cas.diagnostic_approach && cas.diagnostic_approach.length > 0 && (
          <DiagnosticApproach steps={cas.diagnostic_approach} />
        )}

        {/* Red flags */}
        {cas.red_flags?.length > 0 && (
          <div className={card}>
            <span className={sectionLabel}>Signes d'alarme</span>
            {cas.red_flags.map((flag, i) => (
              <div key={i} className="flex gap-3 items-start mb-2.5 last:mb-0">
                <div className="w-1 h-1 rounded-full bg-[#FF3B30] mt-[7px] flex-shrink-0" />
                <p className="text-sm text-[#1D1D1F] leading-relaxed">{flag}</p>
              </div>
            ))}
          </div>
        )}

        {/* Differentials */}
        {cas.differentials?.length > 0 && (
          <div className={card}>
            <span className={sectionLabel}>Diagnostics différentiels</span>
            {cas.differentials.map((diff, i) => (
              <div key={i} className="flex gap-3 items-start py-3 border-b border-[#F5F5F7] last:border-0 last:pb-0 first:pt-0">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 uppercase tracking-widest ${diff.proximity === 'proche' ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'}`}>
                  {diff.proximity === 'proche' ? 'Proche' : 'Écarté'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#1D1D1F]">{diff.diagnosis}</p>
                  <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">{diff.distinction}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Management */}
        {cas.management?.length > 0 && (
          <div className={card}>
            <span className={sectionLabel}>Prise en charge initiale</span>
            {cas.management.map((step, i) => (
              <div key={i} className="flex gap-3 items-start mb-3 last:mb-0">
                <span className="text-[11px] font-bold text-[#0066CC] bg-[#EBF4FF] rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[#1D1D1F] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pearl */}
        {cas.pearl && (
          <div className="bg-[#EBF4FF] rounded-2xl border border-[#C7DEFF] p-5 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0066CC] mb-2 block">Perle clinique</span>
            <p className="text-sm text-[#003D82] leading-relaxed">{cas.pearl}</p>
          </div>
        )}

        {/* Common mistakes */}
        {cas.common_mistakes?.length > 0 && (
          <div className={card}>
            <span className={sectionLabel}>Erreurs classiques</span>
            {cas.common_mistakes.map((mistake, i) => (
              <div key={i} className="flex gap-3 items-start mb-2.5 last:mb-0">
                <div className="w-1 h-1 rounded-full bg-[#FF9F0A] mt-[7px] flex-shrink-0" />
                <p className="text-sm text-[#1D1D1F] leading-relaxed">{mistake}</p>
              </div>
            ))}
          </div>
        )}

        {/* Similar Cases for Retention Loop */}
        <SimilarCases currentCaseId={(cas as any).id} specialty={cas.specialty} />

        {/* Footer */}
        <div className="text-center py-8 flex flex-col items-center gap-3">
          <p className="text-xs text-[#AEAEB2]">🔥 Revenez demain pour garder votre série !</p>
          <div className="flex items-center gap-4">
            <a href="/archives" className="text-xs font-semibold text-[#0066CC] hover:text-[#0055AA] transition-colors">
              Explorer les archives →
            </a>
            <span className="text-[#E8E8ED]">|</span>
            <a href="/profile" className="text-xs font-semibold text-[#0066CC] hover:text-[#0055AA] transition-colors">
              Voir mes statistiques →
            </a>
          </div>
        </div>

        <SaveProgressPrompt streak={streak} />
      </div>
    )
  }

  // ─── Game view ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">Clin</span>
            <span className="text-[17px] font-bold tracking-tight text-[#0066CC]">iQ</span>
            <span className="text-[11px] text-[#AEAEB2] font-medium ml-1.5">— L'instinct absolu</span>
          </div>
          <p className="text-[11px] text-[#AEAEB2] mt-0.5">Cas du jour</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <a href="/archives" className="text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" title="Archives">
              Archives
            </a>
            <a href="/profile" className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" title="Statistiques">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-1.5 bg-[#FFF7ED] border border-[#FED7AA] text-[#C2410C] text-xs font-semibold px-3 py-1.5 rounded-full">
            🔥 {streak} jour{streak > 1 ? 's' : ''}
          </div>
          <AuthButton />
        </div>
      </div>

      {/* Instruction banner */}
      {guesses.length === 0 && (
        <div className="bg-[#EBF4FF] border border-[#C7DEFF] rounded-xl px-4 py-3 mb-3">
          <p className="text-xs text-[#003D82] leading-relaxed">
            Analysez le cas et tapez votre diagnostic. Chaque tentative révèle un nouvel indice. 6 essais maximum.
          </p>
        </div>
      )}

      {/* Patient card */}
      <div className={card}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
              {cas.sex === 'F' ? 'Femme' : 'Homme'}, {cas.age} {cas.age_unit}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              {cas.specialty && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF4FF] text-[#0066CC] border border-[#C7DEFF]/80">
                  {cas.specialty}
                </span>
              )}
              <span className="text-[11px] text-[#AEAEB2]">{cas.setting}</span>
            </div>
          </div>
          {cas.diagnosis_urgency && (
            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 uppercase tracking-widest ${urgencyColor[cas.diagnosis_urgency] || 'bg-[#F5F5F7] text-[#6E6E73] border-[#E8E8ED]'}`}>
              {cas.diagnosis_urgency}
            </span>
          )}
        </div>
        <p className="text-sm text-[#1D1D1F] leading-relaxed border-t border-[#F5F5F7] pt-4 mb-4">
          {cas.chief_complaint}. {cas.context}
        </p>
        <div className="grid grid-cols-4 gap-3 border-t border-[#F5F5F7] pt-4">
          {[
            { value: cas.bp, label: 'TA' },
            { value: cas.hr, label: 'FC' },
            { value: `${cas.temp}°`, label: 'Temp' },
            { value: `${cas.spo2}%`, label: 'SpO2' },
          ].map((v, i) => (
            <div key={i} className="text-center">
              <p className="text-sm font-semibold text-[#1D1D1F]">{v.value}</p>
              <p className="text-[9px] text-[#AEAEB2] mt-0.5 font-semibold uppercase tracking-widest">{v.label}</p>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setShowRefModal(true)}
          className="w-full mt-4 flex items-center gap-3 bg-[#F5F5F7] border border-[#E8E8ED] text-[#1D1D1F] hover:bg-[#E8E8ED] hover:border-[#D2D2D7] py-2.5 px-4 rounded-xl text-xs font-medium transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2v7.31M14 9.31V2M8.5 2h7M14 9.31l6.4 9.6A2 2 0 0 1 18.73 22H5.27a2 2 0 0 1-1.66-3.09L10 9.31"/><path d="M7 16h10"/>
          </svg>
          <span className="flex-1 text-left">Normes Biologiques <span className="text-[#AEAEB2] font-normal">(Cheat Sheet)</span></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* Clues timeline */}
      <div className={card}>
        <span className={sectionLabel}>Raisonnement — {revealedClues.length}/{cas.clues.length}</span>
        <div className="relative">
          {cas.clues.map((clue, i) => {
            const revealed = i < revealedClues.length
            const isLast = i === cas.clues.length - 1
            return (
              <div
                key={clue.id}
                className="relative flex gap-3 items-start"
                style={{
                  opacity: revealed ? 1 : 0.3,
                  transform: revealed ? 'translateY(0)' : 'translateY(3px)',
                  transition: revealed ? 'opacity 0.5s ease, transform 0.5s ease' : 'none',
                }}
              >
                {/* Connector line */}
                {!isLast && (
                  <div
                    className="absolute left-[9px] top-[20px] w-px"
                    style={{
                      height: 'calc(100% + 2px)',
                      background: revealed ? '#C7DEFF' : '#F2F2F7',
                      transition: 'background 0.5s ease',
                    }}
                  />
                )}
                {/* Node */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold border transition-all duration-500 ${
                    revealed
                      ? 'bg-[#0066CC] border-[#0066CC] text-white'
                      : 'bg-white border-[#D2D2D7] text-[#AEAEB2]'
                  }`}>
                    {i + 1}
                  </div>
                </div>
                {/* Text */}
                <div className="pb-4 flex-1 min-w-0">
                  {revealed ? (
                    <p className="text-sm text-[#1D1D1F] leading-relaxed">{clue.text}</p>
                  ) : (
                    <p className="text-sm text-[#D2D2D7] italic">
                      {i === revealedClues.length ? 'Débloqué à la prochaine tentative' : '···'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {/* Final node — game over */}
          {(gameState === 'won' || gameState === 'lost') && (
            <div
              className="relative flex gap-3 items-start"
              style={{ opacity: 1, transform: 'translateY(0)', transition: 'opacity 0.5s ease' }}
            >
              <div className="relative z-10 flex-shrink-0 mt-1">
                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  gameState === 'won' ? 'bg-[#34C759] border-[#34C759]' : 'bg-[#FF3B30] border-[#FF3B30]'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="pb-2 flex-1">
                <p className={`text-sm font-semibold ${gameState === 'won' ? 'text-[#166534]' : 'text-[#B91C1C]'}`}>
                  {gameState === 'won' ? cas.diagnosis_exact : `Diagnostic : ${cas.diagnosis_exact}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guesses history */}
      {guesses.length > 0 && (
        <div className={card}>
          <span className={sectionLabel}>Tentatives</span>
          {guesses.map((guess, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F7] last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#AEAEB2] min-w-[16px] font-semibold">{i + 1}</span>
                <p className="text-sm text-[#1D1D1F]">{guess.text}</p>
              </div>
              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 uppercase tracking-widest ${resultConfig[guess.result].style}`}>
                {resultConfig[guess.result].icon} {resultConfig[guess.result].label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Win state */}
      {gameState === 'won' && (
        <div className="bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] p-5 mb-3 text-center">
          <p className="text-base font-semibold text-[#166534] mb-1">Diagnostic réussi</p>
          <p className="text-xs text-[#6E6E73] mb-3">
            Trouvé en {guesses.length} tentative{guesses.length > 1 ? 's' : ''}
            {elapsedSec > 0 ? ` · ${elapsedSec}s` : ''}
          </p>
          {badge && (
            <div
              className="flex justify-center mb-4"
              style={{
                opacity: showBadge ? 1 : 0,
                transform: showBadge ? 'scale(1)' : 'scale(0.9)',
                transition: 'opacity 0.4s cubic-bezier(0.34,1.56,0.64,1), transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <span
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold tracking-wide border"
                style={{ color: badge.color, backgroundColor: badge.bg, borderColor: badge.border }}
              >
                <span className="text-base">{badge.emoji}</span>
                {badge.label}
                <span className="text-[10px] font-normal opacity-60 ml-1">· {revealedClues.length}/{cas.clues.length} indices</span>
              </span>
            </div>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => setShowSummary(true)} className="bg-[#166534] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#14532D] transition-colors">
              Voir le résumé
            </button>
            <button onClick={() => handleShare(true)} className="bg-white text-[#166534] border border-[#BBF7D0] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#F0FDF4] transition-colors">
              {copied ? 'Copié !' : 'Partager'}
            </button>
          </div>
        </div>
      )}


      {/* Lost state */}
      {gameState === 'lost' && (
        <div className="bg-[#FEF2F2] rounded-2xl border border-[#FECACA] p-5 mb-3 text-center">
          <p className="text-base font-semibold text-[#B91C1C] mb-1">Diagnostic manqué</p>
          <p className="text-xs text-[#6E6E73] mb-1">Le diagnostic était :</p>
          <p className="text-sm font-semibold text-[#1D1D1F] mb-4">{cas.diagnosis_exact}</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => setShowSummary(true)} className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#991B1B] transition-colors">
              Voir le résumé
            </button>
            <button onClick={() => handleShare(false)} className="bg-white text-[#B91C1C] border border-[#FECACA] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#FEF2F2] transition-colors">
              {copied ? 'Copié !' : 'Partager'}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {gameState === 'playing' && (
        <div className={card}>
          <span className={sectionLabel}>Votre diagnostic</span>
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tapez votre diagnostic..."
                className="flex-1 border border-[#E8E8ED] rounded-xl px-4 py-3.5 text-sm text-[#1D1D1F] outline-none focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/10 bg-white transition-all placeholder:text-[#AEAEB2]"
                value={currentGuess}
                onChange={e => { setCurrentGuess(e.target.value); setShowSuggestions(true) }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleGuess()
                  if (e.key === 'Escape') setShowSuggestions(false)
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                disabled={submitting}
              />
              <button
                onClick={handleGuess}
                disabled={submitting}
                className={`bg-[#0066CC] hover:bg-[#0055AA] active:bg-[#004499] text-white px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[100px] ${
                  guesses.length === 0 && gameState === 'playing' ? 'animate-glow' : ''
                }`}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Valider'
                )}
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bottom-full mb-1.5 bg-white border border-[#E8E8ED] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
                {suggestions.map((s, i) => {
                  const alreadyGuessed = guesses.some(g => normalize(g.text) === normalize(s))
                  return (
                    <div
                      key={i}
                      className={`px-4 py-3 text-sm border-b border-[#F5F5F7] last:border-0 ${
                        alreadyGuessed
                          ? 'text-[#AEAEB2] cursor-not-allowed bg-[#F5F5F7]'
                          : 'text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer active:bg-[#EBF4FF]'
                      }`}
                      onMouseDown={() => {
                        if (alreadyGuessed) return
                        setCurrentGuess(s)
                        setShowSuggestions(false)
                      }}
                    >
                      {s}
                      {alreadyGuessed && <span className="ml-2 text-xs text-[#AEAEB2]">déjà essayé</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Hint + counter */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-[#6E6E73]">
              {guesses.length >= 3 && guesses[guesses.length - 1].result !== 'correct' && (
                <span>💡 {cas.wrong_answer_hint}</span>
              )}
            </p>
            <p className="text-xs font-semibold text-[#AEAEB2]">{guesses.length}/{MAX_ATTEMPTS}</p>
          </div>
        </div>
      )}

      <ReferenceValuesModal isOpen={showRefModal} onClose={() => setShowRefModal(false)} />
    </div>
  )
}
