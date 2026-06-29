'use client'

import { useState } from 'react'
import { DIAGNOSES } from '@/lib/diagnoses'

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
  sex: string
  setting: string
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
  diagnosis_urgency: string
  wrong_answer_hint: string
  explanation: string
  pearl: string
  red_flags: string[]
  differentials: Differential[]
  management: string[]
  common_mistakes: string[]
}

type GuessResult = {
  text: string
  result: 'correct' | 'proche' | 'faux'
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

export default function GameBoard({ cas }: { cas: Case }) {
  const [revealedClues, setRevealedClues] = useState(cas.clues.filter(c => c.auto_reveal))
  const [guesses, setGuesses] = useState<GuessResult[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [showSummary, setShowSummary] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [copied, setCopied] = useState(false)

  const MAX_ATTEMPTS = 6

  const suggestions = currentGuess.length >= 2
    ? DIAGNOSES.filter(d => normalize(d).includes(normalize(currentGuess))).slice(0, 5)
    : []

  const handleGuess = () => {
    if (!currentGuess.trim() || gameState !== 'playing') return

    const result = judgeGuess(currentGuess, cas)
    const newGuess: GuessResult = { text: currentGuess, result }
    const newGuesses = [...guesses, newGuess]
    setGuesses(newGuesses)
    setCurrentGuess('')
    setShowSuggestions(false)

    if (result === 'correct') {
  setRevealedClues(cas.clues)
  setGameState('won')
  return
}

    const nextClueIndex = revealedClues.length
    if (nextClueIndex < cas.clues.length) {
      setRevealedClues([...revealedClues, cas.clues[nextClueIndex]])
    }

    if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameState('lost')
    }
  }

  const resultLabel = {
    correct: { text: 'Correct', class: 'bg-green-50 text-green-700 border-green-200' },
    proche: { text: 'Proche', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    faux: { text: 'Faux', class: 'bg-red-50 text-red-700 border-red-200' },
  }

  if (showSummary) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ClinIQ</h1>
            <p className="text-sm text-gray-400">Résumé du cas</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-xs text-gray-400 mb-1">Diagnostic</p>
          <p className="text-xl font-semibold text-gray-900 mb-3">{cas.diagnosis_exact}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{cas.explanation}</p>
        </div>

        {cas.red_flags?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <p className="text-xs text-gray-400 mb-3">Signes d'alarme</p>
            {cas.red_flags.map((flag, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{flag}</p>
              </div>
            ))}
          </div>
        )}

        {cas.differentials?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <p className="text-xs text-gray-400 mb-3">Diagnostics différentiels</p>
            {cas.differentials.map((diff, i) => (
              <div key={i} className="flex gap-3 items-start py-2 border-b border-gray-50 last:border-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${diff.proximity === 'proche' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {diff.proximity === 'proche' ? 'Proche' : 'Écarté'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{diff.diagnosis}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{diff.distinction}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {cas.management?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <p className="text-xs text-gray-400 mb-3">Prise en charge initiale</p>
            {cas.management.map((step, i) => (
              <div key={i} className="flex gap-3 items-start mb-2">
                <span className="text-xs font-medium text-blue-600 min-w-[20px]">{i + 1}</span>
                <p className="text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        )}

        {cas.pearl && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-4">
            <p className="text-xs font-medium text-blue-600 mb-2">Perle clinique</p>
            <p className="text-sm text-gray-700 leading-relaxed">{cas.pearl}</p>
          </div>
        )}

        {cas.common_mistakes?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <p className="text-xs text-gray-400 mb-3">Erreurs classiques</p>
            {cas.common_mistakes.map((mistake, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{mistake}</p>
              </div>
            ))}
          </div>
        )}

       <div className="text-center pb-8">
          <p className="text-sm text-gray-400 mb-4">Revenez demain pour un nouveau cas</p>
          <a href="/archives" className="text-sm text-blue-600 font-medium">Explorer les archives</a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ClinIQ</h1>
          <p className="text-sm text-gray-400">Cas du jour</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/archives" className="text-sm text-blue-600 font-medium">Archives</a>
          <span className="text-sm font-medium text-orange-500">🔥 Série</span>
        </div>
      </div>

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

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs text-gray-400 mb-3">
          Indices ({revealedClues.length}/{cas.clues.length})
        </p>
        {revealedClues.map((clue) => (
          <div key={clue.id} className="flex gap-2 items-start py-2 border-b border-gray-50 last:border-0">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{clue.text}</p>
          </div>
        ))}
        {gameState === 'playing' && revealedClues.length < cas.clues.length && (
          <p className="text-xs text-gray-300 mt-2">
            Prochain indice après votre prochaine tentative
          </p>
        )}
      </div>

      {guesses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-xs text-gray-400 mb-3">Tentatives</p>
          {guesses.map((guess, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-300">{i + 1}</span>
                <p className="text-sm text-gray-700">{guess.text}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${resultLabel[guess.result].class}`}>
                {resultLabel[guess.result].text}
              </span>
            </div>
          ))}
        </div>
      )}

      {gameState === 'won' && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-4 text-center">
          <p className="text-lg font-semibold text-green-700 mb-1">Bravo !</p>
          <p className="text-sm text-green-600 mb-4">
            Trouvé en {guesses.length} tentative{guesses.length > 1 ? 's' : ''}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowSummary(true)}
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              Voir le résumé
            </button>
            <button
              onClick={() => {
                const emojis = guesses.map(g =>
                  g.result === 'correct' ? '🟩' : g.result === 'proche' ? '🟨' : '🟥'
                ).join('')
                const text = `🩺 ClinIQ\n${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}\nTrouvé en ${guesses.length} tentative${guesses.length > 1 ? 's' : ''}\n${emojis}\nhttps://cliniq-blond-nu.vercel.app`
                navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="bg-white text-green-700 border border-green-200 px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              {copied ? 'Copié !' : 'Partager'}
            </button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5 mb-4 text-center">
          <p className="text-lg font-semibold text-red-700 mb-1">Perdu</p>
          <p className="text-sm text-red-600 mb-1">Le diagnostic était :</p>
          <p className="text-base font-semibold text-red-800 mb-4">{cas.diagnosis_exact}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowSummary(true)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              Voir le résumé
            </button>
            <button
              onClick={() => {
                const emojis = guesses.map(g =>
                  g.result === 'correct' ? '🟩' : g.result === 'proche' ? '🟨' : '🟥'
                ).join('')
                const text = `🩺 ClinIQ\n${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}\nNon trouvé\n${emojis}\nhttps://cliniq-blond-nu.vercel.app`
                navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="bg-white text-red-700 border border-red-200 px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              {copied ? 'Copié !' : 'Partager'}
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-gray-400">Votre diagnostic</p>
            <p className="text-xs text-gray-300">{guesses.length}/{MAX_ATTEMPTS} tentatives</p>
          </div>
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Entrez votre diagnostic..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-300"
                value={currentGuess}
                onChange={e => {
                  setCurrentGuess(e.target.value)
                  setShowSuggestions(true)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleGuess()
                  if (e.key === 'Escape') setShowSuggestions(false)
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              <button
                onClick={handleGuess}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
              >
                Valider
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {suggestions.map((s, i) => {
                  const alreadyGuessed = guesses.some(
                    g => normalize(g.text) === normalize(s)
                  )
                  return (
                    <div
                      key={i}
                      className={`px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 ${
                        alreadyGuessed
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                          : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                      }`}
                      onMouseDown={() => {
                        if (alreadyGuessed) return
                        setCurrentGuess(s)
                        setShowSuggestions(false)
                      }}
                    >
                      {s}
                      {alreadyGuessed && (
                        <span className="ml-2 text-xs text-gray-300">déjà essayé</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {guesses.length >= 3 &&
  guesses[guesses.length - 1].result !== 'correct' && (
    <p className="text-xs text-gray-400 mt-2">
      {cas.wrong_answer_hint}
    </p>
)}
        </div>
      )}
    </div>
  )
}