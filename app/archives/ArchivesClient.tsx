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
    if (d === 1) return { text: 'Facile', class: 'bg-green-50 text-green-700 border-green-200' }
    if (d === 2) return { text: 'Moyen', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
    return { text: 'Difficile', class: 'bg-red-50 text-red-700 border-red-200' }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div>
            <span className="text-xl font-semibold text-gray-900">Clin</span>
            <span className="text-xl font-semibold text-blue-600">IQ</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Archives — {filtered.length} cas</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Cas du jour
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {specialties.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSpecialty(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedSpecialty === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-sm">Aucun cas dans cette spécialité.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((cas) => {
          const diff = difficultyLabel(cas.difficulty)
          return (
            <Link key={cas.id} href={`/archives/${cas.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{cas.specialty}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cas.sex === 'F' ? 'Femme' : 'Homme'}, {cas.age} {cas.age_unit} — {cas.setting}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex-shrink-0 ${diff.class}`}>
                    {diff.text}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                  {cas.chief_complaint}
                </p>
                <p className="text-xs text-gray-300 mt-2">
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