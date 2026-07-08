'use client'

import { useState, useEffect } from 'react'
import { DIAGNOSES, ABBREVIATIONS } from '@/lib/diagnoses'
import { supabase } from '@/lib/supabase'
import AuthButton from './AuthButton'
import DiagnosticApproach from './SchemaViewer'
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
}

type GuessResult = {
  text: string
  result: 'correct' | 'proche' | 'faux'
}
function SaveProgressPrompt({ streak }: { streak: number }) {
  const [user, setUser] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const { createClient } = require('@supabase/supabase-js')
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    client.auth.getUser().then(({ data }: any) => {
      setUser(!!data.user)
    })
  }, [])

  if (user === null || user === true || dismissed) return null

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-3">
      <p className="text-sm font-medium text-blue-900 mb-1">
        Sauvegardez votre progression
      </p>
      <p className="text-xs text-blue-600 mb-4 leading-relaxed">
        Créez un compte pour ne jamais perdre votre série de {streak} jour{streak > 1 ? 's' : ''} et suivre vos progrès sur tous vos appareils.
      </p>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            const { createClient } = require('@supabase/supabase-js')
            const client = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            await client.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/callback` }
            })
          }}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium"
        >
          Continuer avec Google
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-4 py-2.5 rounded-xl text-sm text-blue-400 hover:text-blue-600 transition-colors"
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
  'Urgence vitale': 'bg-red-50 text-red-700 border-red-200',
  'Urgence différée': 'bg-orange-50 text-orange-700 border-orange-200',
  'Semi-urgent': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Non urgent': 'bg-green-50 text-green-700 border-green-200',
}

const resultStyle: Record<string, { label: string; style: string }> = {
  correct: { label: 'Correct', style: 'bg-green-50 text-green-700 border-green-200' },
  proche:  { label: 'Proche',  style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  faux:    { label: 'Faux',    style: 'bg-red-50 text-red-700 border-red-200' },
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

  const MAX_ATTEMPTS = 6

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastVisit = localStorage.getItem('lastVisitDate')
    const currentStreak = parseInt(localStorage.getItem('currentStreak') || '0')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    let newStreak = 1
    if (lastVisit === today) newStreak = currentStreak
    else if (lastVisit === yesterdayStr) newStreak = currentStreak + 1
    else newStreak = 1
    localStorage.setItem('lastVisitDate', today)
    localStorage.setItem('currentStreak', newStreak.toString())
    setStreak(newStreak)
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
        const abbrevMatches = ABBREVIATIONS[upper]
          ? ABBREVIATIONS[upper]
          : []
        const textMatches = DIAGNOSES.filter(d =>
          normalize(d).includes(normalize(currentGuess)) &&
          !abbrevMatches.includes(d)
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
      setRevealedClues(cas.clues)
      setGameState('won')
      await trackEvent('case_completed', {
        result: 'won',
        attempts: newGuesses.length,
      })
      return
    }
    const nextClueIndex = revealedClues.length
    if (nextClueIndex < cas.clues.length) {
      setRevealedClues([...revealedClues, cas.clues[nextClueIndex]])
    }
    if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameState('lost')
      await trackEvent('case_completed', {
        result: 'lost',
        attempts: newGuesses.length,
      })
    }
  }

  const handleShare = (won: boolean) => {
    const emojis = guesses.map(g =>
      g.result === 'correct' ? '🟩' : g.result === 'proche' ? '🟨' : '🟥'
    ).join('')
    const text = won
      ? `🩺 ClinIQ\n${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}\nTrouvé en ${guesses.length} tentative${guesses.length > 1 ? 's' : ''}\n${emojis}\nhttps://cliniq-blond-nu.vercel.app`
      : `🩺 ClinIQ\n${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}\nNon trouvé\n${emojis}\nhttps://cliniq-blond-nu.vercel.app`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const card = 'bg-white rounded-2xl border border-gray-100 p-5 mb-3'
  const label = 'text-xs font-medium uppercase tracking-wide text-gray-400 mb-3 block'

  if (showSummary) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <div>
              <span className="text-xl font-semibold text-gray-900">Clin</span>
              <span className="text-xl font-semibold text-blue-600">IQ</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Résumé du cas</p>
          </div>
          <button
            onClick={() => handleShare(gameState === 'won')}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            {copied ? '✓ Copié' : 'Partager'}
          </button>
        </div>

        <div className={card}>
          <p className={label}>Diagnostic</p>
          <p className="text-xl font-semibold text-gray-900 mb-3">{cas.diagnosis_exact}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{cas.explanation}</p>
        </div>

         {cas.diagnostic_approach && cas.diagnostic_approach.length > 0 && (
          <DiagnosticApproach steps={cas.diagnostic_approach} />
        )}

        {cas.red_flags?.length > 0 && (
          <div className={card}>
            <p className={label}>Signes d'alarme</p>
            {cas.red_flags.map((flag, i) => (
              <div key={i} className="flex gap-3 items-start mb-2 last:mb-0">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">{flag}</p>
              </div>
            ))}
          </div>
        )}

        {cas.differentials?.length > 0 && (
          <div className={card}>
            <p className={label}>Diagnostics différentiels</p>
            {cas.differentials.map((diff, i) => (
              <div key={i} className="flex gap-3 items-start py-2.5 border-b border-gray-50 last:border-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${diff.proximity === 'proche' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {diff.proximity === 'proche' ? 'Proche' : 'Écarté'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{diff.diagnosis}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{diff.distinction}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {cas.management?.length > 0 && (
          <div className={card}>
            <p className={label}>Prise en charge initiale</p>
            {cas.management.map((step, i) => (
              <div key={i} className="flex gap-3 items-start mb-2.5 last:mb-0">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        )}

        {cas.pearl && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-500 mb-2">Perle clinique</p>
            <p className="text-sm text-blue-900 leading-relaxed">{cas.pearl}</p>
          </div>
        )}

        {cas.common_mistakes?.length > 0 && (
          <div className={card}>
            <p className={label}>Erreurs classiques</p>
            {cas.common_mistakes.map((mistake, i) => (
              <div key={i} className="flex gap-3 items-start mb-2 last:mb-0">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">{mistake}</p>
              </div>
            ))}
          </div>
        )}

        <div className="text-center py-6">
          <p className="text-sm text-gray-400 mb-2">Revenez demain pour un nouveau cas</p>
          <a href="/archives" className="text-sm text-blue-600 font-medium">
            Explorer les archives
          </a>
        </div>

        <SaveProgressPrompt streak={streak} />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div>
            <span className="text-xl font-semibold text-gray-900">Clin</span>
            <span className="text-xl font-semibold text-blue-600">IQ</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Cas du jour</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/archives" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Archives
          </a>
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-medium px-3 py-1.5 rounded-full">
            🔥 {streak} jour{streak > 1 ? 's' : ''}
          </div>
          <AuthButton />
        </div>
      </div>

      {guesses.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-3 flex gap-2 items-start">
          <p className="text-xs text-blue-600 leading-relaxed">
            Analysez le cas et tapez votre diagnostic. Chaque tentative révèle un nouvel indice. 6 essais maximum.
          </p>
        </div>
      )}

      <div className={card}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-base font-medium text-gray-900">
              {cas.sex === 'F' ? 'Femme' : 'Homme'}, {cas.age} {cas.age_unit}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {cas.setting}{cas.specialty ? ` · ${cas.specialty}` : ''}
            </p>
          </div>
          {cas.diagnosis_urgency && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${urgencyColor[cas.diagnosis_urgency] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {cas.diagnosis_urgency}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-50 pt-3 mb-4">
          {cas.chief_complaint}. {cas.context}
        </p>
        <div className="grid grid-cols-4 gap-2 border-t border-gray-50 pt-3">
          {[
            { value: cas.bp, label: 'TA' },
            { value: cas.hr, label: 'FC' },
            { value: `${cas.temp}°`, label: 'Temp' },
            { value: `${cas.spo2}%`, label: 'SpO2' },
          ].map((v, i) => (
            <div key={i} className="text-center">
              <p className="text-sm font-medium text-gray-900">{v.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{v.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <p className={label}>Raisonnement — {revealedClues.length}/{cas.clues.length}</p>
        <div className="relative">
          {cas.clues.map((clue, i) => {
            const revealed = i < revealedClues.length
            const isLast = i === cas.clues.length - 1
            return (
              <div
                key={clue.id}
                className="relative flex gap-3 items-start"
                style={{
                  opacity: revealed ? 1 : 0.35,
                  transform: revealed ? 'translateY(0)' : 'translateY(4px)',
                  transition: revealed ? 'opacity 0.4s ease, transform 0.4s ease' : 'none',
                }}
              >
                {/* Vertical line */}
                {!isLast && (
                  <div
                    className="absolute left-[9px] top-[22px] w-px"
                    style={{
                      height: 'calc(100% + 4px)',
                      background: revealed ? '#BFDBFE' : '#F3F4F6',
                      transition: 'background 0.4s ease',
                    }}
                  />
                )}

                {/* Node */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div
                    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-semibold border transition-all duration-400 ${
                      revealed
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-300'
                    }`}
                  >
                    {i + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="pb-4 flex-1 min-w-0">
                  {revealed ? (
                    <p className="text-sm text-gray-700 leading-relaxed">{clue.text}</p>
                  ) : (
                    <p className="text-sm text-gray-300 italic">
                      {i === revealedClues.length
                        ? 'Débloquez avec votre prochaine tentative'
                        : '···'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {/* Final diagnosis node — only after game ends */}
          {(gameState === 'won' || gameState === 'lost') && (
            <div
              className="relative flex gap-3 items-start"
              style={{ opacity: 1, transform: 'translateY(0)', transition: 'opacity 0.4s ease' }}
            >
              <div className="relative z-10 flex-shrink-0 mt-1">
                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 transition-all duration-400 ${
                  gameState === 'won'
                    ? 'bg-green-600 border-green-600'
                    : 'bg-red-500 border-red-500'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="pb-2 flex-1">
                <p className={`text-sm font-medium ${gameState === 'won' ? 'text-green-700' : 'text-red-600'}`}>
                  {gameState === 'won' ? cas.diagnosis_exact : `Diagnostic : ${cas.diagnosis_exact}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {guesses.length > 0 && (
        <div className={card}>
          <p className={label}>Tentatives</p>
          {guesses.map((guess, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-300 min-w-[14px]">{i + 1}</span>
                <p className="text-sm text-gray-700">{guess.text}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex-shrink-0 ${resultStyle[guess.result].style}`}>
                {resultStyle[guess.result].label}
              </span>
            </div>
          ))}
        </div>
      )}

      {gameState === 'won' && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-3 text-center">
          <p className="text-lg font-semibold text-green-800 mb-1">Bravo !</p>
          <p className="text-sm text-green-600 mb-4">
            Trouvé en {guesses.length} tentative{guesses.length > 1 ? 's' : ''}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => setShowSummary(true)} className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
              Voir le résumé
            </button>
            <button onClick={() => handleShare(true)} className="bg-white text-green-700 border border-green-200 px-5 py-2.5 rounded-xl text-sm font-medium">
              {copied ? 'Copié !' : 'Partager'}
            </button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5 mb-3 text-center">
          <p className="text-lg font-semibold text-red-800 mb-1">Perdu</p>
          <p className="text-sm text-red-600 mb-1">Le diagnostic était :</p>
          <p className="text-base font-semibold text-red-900 mb-4">{cas.diagnosis_exact}</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => setShowSummary(true)} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
              Voir le résumé
            </button>
            <button onClick={() => handleShare(false)} className="bg-white text-red-700 border border-red-200 px-5 py-2.5 rounded-xl text-sm font-medium">
              {copied ? 'Copié !' : 'Partager'}
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className={card}>
          <p className={label}>Votre diagnostic</p>
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tapez votre diagnostic..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 outline-none focus:border-blue-300 bg-white transition-colors"
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
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-3.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2 min-w-[100px]"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Valider'
                )}
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bottom-full mb-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {suggestions.map((s, i) => {
                  const alreadyGuessed = guesses.some(g => normalize(g.text) === normalize(s))
                  return (
                    <div
                      key={i}
                      className={`px-4 py-3 text-sm border-b border-gray-50 last:border-0 ${alreadyGuessed ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-700 hover:bg-gray-50 cursor-pointer active:bg-blue-50'}`}
                      onMouseDown={() => {
                        if (alreadyGuessed) return
                        setCurrentGuess(s)
                        setShowSuggestions(false)
                      }}
                    >
                      {s}
                      {alreadyGuessed && <span className="ml-2 text-xs text-gray-300">déjà essayé</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-gray-500">
              {guesses.length >= 3 && guesses[guesses.length - 1].result !== 'correct' && (
                <span>💡 {cas.wrong_answer_hint}</span>
              )}
            </p>
            <p className="text-sm font-medium text-gray-600">{guesses.length}/{MAX_ATTEMPTS}</p>
          </div>
        </div>
      )}
    </div>
  )
}