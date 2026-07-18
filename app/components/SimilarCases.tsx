'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SimilarCases({ 
  currentCaseId, 
  specialty 
}: { 
  currentCaseId?: string, 
  specialty: string 
}) {
  const [similar, setSimilar] = useState<any[]>([])

  useEffect(() => {
    async function fetchSimilar() {
      let query = supabase
        .from('cases')
        .select('id, title, difficulty, setting')
        .eq('status', 'published')
        .eq('specialty', specialty)
      
      if (currentCaseId) {
        query = query.neq('id', currentCaseId)
      }
      
      const { data } = await query.limit(2)
        
      if (data) setSimilar(data)
    }
    
    if (specialty) fetchSimilar()
  }, [currentCaseId, specialty])

  if (similar.length === 0) return null

  return (
    <div className="mt-8 mb-4">
      <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">
        Continuer à s'entraîner en {specialty}
      </h3>
      <div className="flex flex-col gap-2.5">
        {similar.map(c => (
          <Link 
            key={c.id} 
            href={`/archives/${c.id}`} 
            className="flex flex-col p-3.5 bg-white rounded-xl border border-[#E8E8ED] hover:border-[#0066CC] transition-colors"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-semibold text-[#1D1D1F] line-clamp-1 pr-2">{c.title}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${c.difficulty === 1 ? 'bg-green-50 text-green-700' : c.difficulty === 2 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                {c.difficulty === 1 ? 'Facile' : c.difficulty === 2 ? 'Moyen' : 'Difficile'}
              </span>
            </div>
            <span className="text-xs text-[#6E6E73]">{c.setting}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
