'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Case = {
  id: string
  title: string
  specialty: string
  difficulty: number
  publish_date: string
  age: number
  age_unit: string
  sex: string
  setting: string
  chief_complaint: string
}

// Reads all played case IDs from localStorage
function getPlayedCases(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cliniq_'))
    return new Set(keys.map(k => k.replace('cliniq_', '')))
  } catch {
    return new Set()
  }
}

const difficultyDot = (d: number) => {
  if (d === 1) return { color: 'bg-emerald-400', label: 'Facile' }
  if (d === 2) return { color: 'bg-amber-400', label: 'Moyen' }
  return { color: 'bg-rose-500', label: 'Difficile' }
}

export default function ArchivesClient({ cases }: { cases: Case[] }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tous')
  const [selectedDifficulty, setSelectedDifficulty] = useState(0) // 0 = tous
  const [search, setSearch] = useState('')
  const [playedCases, setPlayedCases] = useState<Set<string>>(new Set())

  useEffect(() => {
    setPlayedCases(getPlayedCases())
  }, [])

  const specialties = ['Tous', ...Array.from(new Set(cases.map(c => c.specialty))).sort()]

  const filtered = cases.filter(c => {
    if (selectedSpecialty !== 'Tous' && c.specialty !== selectedSpecialty) return false
    if (selectedDifficulty !== 0 && c.difficulty !== selectedDifficulty) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (
        !c.chief_complaint.toLowerCase().includes(q) &&
        !c.specialty.toLowerCase().includes(q) &&
        !c.title.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const completedCount = cases.filter(c => playedCases.has(c.id)).length

  return (
    <div className="max-w-lg mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div>
            <span className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">Clin</span>
            <span className="text-[17px] font-semibold tracking-tight text-[#0066CC]">IQ</span>
          </div>
          <p className="text-[11px] text-[#AEAEB2] mt-0.5">
            Archives — {completedCount}/{cases.length} complétés
          </p>
        </div>
        <Link href="/" className="text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
          Cas du jour
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Rechercher un cas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-[#E8E8ED] rounded-2xl pl-9 pr-4 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#AEAEB2] outline-none focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/10 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#1D1D1F] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex gap-2 flex-wrap mb-2">
        {specialties.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSpecialty(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedSpecialty === s
                ? 'bg-[#0066CC] text-white border-[#0066CC]'
                : 'bg-white text-[#6E6E73] border-[#E8E8ED] hover:border-[#D2D2D7] hover:text-[#1D1D1F]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Difficulty filter dots */}
      <div className="flex gap-3 items-center mb-5">
        <button
          onClick={() => setSelectedDifficulty(0)}
          className={`text-xs font-medium transition-colors ${selectedDifficulty === 0 ? 'text-[#1D1D1F]' : 'text-[#AEAEB2] hover:text-[#6E6E73]'}`}
        >
          Tous niveaux
        </button>
        {[1, 2, 3].map(d => {
          const dot = difficultyDot(d)
          return (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(selectedDifficulty === d ? 0 : d)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all ${selectedDifficulty === d ? 'text-[#1D1D1F]' : 'text-[#AEAEB2] hover:text-[#6E6E73]'}`}
            >
              <span className={`w-2 h-2 rounded-full ${dot.color} ${selectedDifficulty === d ? 'scale-125' : ''} transition-transform`} />
              {dot.label}
            </button>
          )
        })}
      </div>

      {/* Results count */}
      {(search || selectedDifficulty !== 0 || selectedSpecialty !== 'Tous') && (
        <p className="text-[11px] text-[#AEAEB2] mb-3">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E8ED] p-10 text-center">
          <p className="text-sm text-[#AEAEB2]">Aucun cas ne correspond à votre recherche.</p>
          <button
            onClick={() => { setSearch(''); setSelectedSpecialty('Tous'); setSelectedDifficulty(0) }}
            className="text-xs text-[#0066CC] mt-2 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Cases list */}
      <div className="flex flex-col gap-3">
        {filtered.map((cas) => {
          const dot = difficultyDot(cas.difficulty)
          const isPlayed = playedCases.has(cas.id)
          return (
            <Link key={cas.id} href={`/archives/${cas.id}`}>
              <div className={`bg-white rounded-2xl border p-5 hover:border-[#C7DEFF] hover:shadow-[0_2px_12px_rgba(0,102,204,0.06)] transition-all cursor-pointer ${isPlayed ? 'border-[#E8E8ED]' : 'border-[#E8E8ED]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#AEAEB2]">{cas.specialty}</p>
                      {isPlayed && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 flex-shrink-0">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Joué
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#1D1D1F] tracking-tight">
                      {cas.sex === 'F' ? 'Femme' : 'Homme'}, {cas.age} {cas.age_unit} — {cas.setting}
                    </p>
                  </div>
                  {/* Difficulty dot only */}
                  <span className={`w-2.5 h-2.5 rounded-full ${dot.color} flex-shrink-0 ml-3 mt-1`} />
                </div>
                <p className="text-sm text-[#6E6E73] leading-relaxed line-clamp-2">
                  {cas.chief_complaint}
                </p>
                <p className="text-[11px] text-[#AEAEB2] mt-2.5 font-medium">
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

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  )
}