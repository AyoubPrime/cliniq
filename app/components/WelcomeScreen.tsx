'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'cliniq_welcomed_v1'

export default function WelcomeScreen() {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      // Small delay so the game underneath renders first
      const t = setTimeout(() => setVisible(true), 300)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    setClosing(true)
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1')
      setVisible(false)
      setClosing(false)
    }, 400)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-5 transition-all duration-400 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className={`bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl transition-all duration-400 ${
          closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ transform: closing ? 'scale(0.96) translateY(8px)' : 'scale(1) translateY(0)' }}
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-baseline gap-0.5 mb-1">
            <span className="text-[22px] font-semibold tracking-tight text-[#1D1D1F]">Clin</span>
            <span className="text-[22px] font-semibold tracking-tight text-[#0066CC]">iQ</span>
          </div>
          <div className="h-px w-8 bg-[#0066CC] opacity-40 rounded-full" />
        </div>

        {/* Headline */}
        <div className="mb-8">
          <p className="text-[28px] font-semibold tracking-tight text-[#1D1D1F] leading-snug mb-3">
            Un cas clinique<br />par jour.
          </p>
          <p className="text-[15px] text-[#6E6E73] leading-relaxed">
            Analysez les indices. Posez votre diagnostic. Apprenez du résumé.
          </p>
        </div>

        {/* 3 pillars */}
        <div className="flex flex-col gap-3 mb-8">
          <Pillar
            icon="🔍"
            title="Analysez"
            desc="Découvrez les indices progressivement"
          />
          <Pillar
            icon="🩺"
            title="Diagnostiquez"
            desc="Proposez votre diagnostic en 6 tentatives"
          />
          <Pillar
            icon="📖"
            title="Apprenez"
            desc="Un résumé clinique complet après chaque cas"
          />
        </div>

        {/* CTA */}
        <button
          id="welcome-start-btn"
          onClick={dismiss}
          className="w-full bg-[#0066CC] hover:bg-[#0055AA] active:scale-[0.98] text-white py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-150 shadow-sm"
        >
          Commencer
        </button>

        {/* Fine print */}
        <p className="text-center text-[11px] text-[#AEAEB2] mt-4">
          Un nouveau cas chaque jour · Gratuit
        </p>
      </div>
    </div>
  )
}

function Pillar({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-[#F5F5F7] rounded-2xl px-4 py-3">
      <span className="text-[18px] mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-[13px] font-semibold text-[#1D1D1F]">{title}</p>
        <p className="text-[12px] text-[#6E6E73] leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
