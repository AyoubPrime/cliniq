'use client'

import { useState } from 'react'
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

export default function ArchivesClient({ cases }: { cases: Case[] }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tous')

  const specialties = ['Tous', ...Array.from(new Set(cases.map(c => c.specialty))).sort()]

  const filtered = selectedSpecialty === 'Tous'
    ? cases
    : cases.filter(c => c.specialty === selectedSpecialty)

  const difficultyLabel = (d: number) => {
    if (d === 1) return { text: 'Facile', cls: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' }
    if (d === 2) return { text: 'Moyen',  cls: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' }
    return          { text: 'Difficile', cls: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]' }
  }

  return (
    <div className="max-w-lg mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div>
            <span className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">Clin</span>
            <span className="text-[17px] font-semibold tracking-tight text-[#0066CC]">IQ</span>
          </div>
          <p className="text-[11px] text-[#AEAEB2] mt-0.5">Archives — {filtered.length} cas</p>
        </div>
        <Link href="/" className="text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
          Cas du jour
        </Link>
      </div>

      {/* Specialty filter */}
      <div className="flex gap-2 flex-wrap mb-5">
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E8ED] p-8 text-center">
          <p className="text-sm text-[#AEAEB2]">Aucun cas dans cette spécialité.</p>
        </div>
      )}

      {/* Cases list */}
      <div className="flex flex-col gap-3">
        {filtered.map((cas) => {
          const diff = difficultyLabel(cas.difficulty)
          return (
            <Link key={cas.id} href={`/archives/${cas.id}`}>
              <div className="bg-white rounded-2xl border border-[#E8E8ED] p-5 hover:border-[#C7DEFF] hover:shadow-[0_2px_12px_rgba(0,102,204,0.06)] transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#AEAEB2] mb-1">{cas.specialty}</p>
                    <p className="text-sm font-semibold text-[#1D1D1F] tracking-tight">
                      {cas.sex === 'F' ? 'Femme' : 'Homme'}, {cas.age} {cas.age_unit} — {cas.setting}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 uppercase tracking-widest ${diff.cls}`}>
                    {diff.text}
                  </span>
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
    </div>
  )
}