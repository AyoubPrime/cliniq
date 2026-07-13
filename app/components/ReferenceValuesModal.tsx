'use client'

import { useEffect } from 'react'

type ReferenceValuesModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ReferenceValuesModal({ isOpen, onClose }: ReferenceValuesModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31M14 9.31V2M8.5 2h7M14 9.31l6.4 9.6A2 2 0 0 1 18.73 22H5.27a2 2 0 0 1-1.66-3.09L10 9.31"/>
                <path d="M7 16h10"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Valeurs Biologiques Normales</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100/50 transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5 custom-scrollbar">
          <div className="space-y-6">
            
            {/* FNS */}
            <Section title="Hémogramme (FNS)">
              <Row label="Hémoglobine (Hb)" value="♂ 13-17 g/dL | ♀ 12-16 g/dL" />
              <Row label="VGM" value="80 - 100 fL" />
              <Row label="Leucocytes (GB)" value="4 000 - 10 000 /mm³" />
              <Row label="PNN" value="1 500 - 7 000 /mm³" indent />
              <Row label="Lymphocytes" value="1 500 - 4 000 /mm³" indent />
              <Row label="Plaquettes" value="150 000 - 400 000 /mm³" />
              <Row label="Réticulocytes" value="20 000 - 100 000 /mm³" />
            </Section>

            {/* Iono */}
            <Section title="Ionogramme Sanguin">
              <Row label="Sodium (Na+)" value="135 - 145 mmol/L" />
              <Row label="Potassium (K+)" value="3.5 - 5.0 mmol/L" />
              <Row label="Chlore (Cl-)" value="98 - 107 mmol/L" />
              <Row label="Calcium total (Ca2+)" value="2.20 - 2.60 mmol/L" />
            </Section>

            {/* Rénal & Glucidique */}
            <Section title="Bilan Rénal & Glucidique">
              <Row label="Créatininémie" value="♂ 60-105 µmol/L | ♀ 45-85 µmol/L" />
              <Row label="Urée" value="2.5 - 7.5 mmol/L" />
              <Row label="Glycémie à jeun" value="0.70 - 1.10 g/L (3.9 - 6.1 mmol/L)" />
              <Row label="HbA1c" value="4.0 - 5.6 % (Diabète ≥ 6.5 %)" />
            </Section>

            {/* Hépatique */}
            <Section title="Bilan Hépatique & Pancréatique">
              <Row label="ASAT / ALAT" value="< 40 UI/L" />
              <Row label="Bilirubine totale" value="< 17 µmol/L (10 mg/L)" />
              <Row label="PAL" value="40 - 120 UI/L" />
              <Row label="GGT" value="♂ < 40 UI/L | ♀ < 30 UI/L" />
              <Row label="Lipase" value="< 60 UI/L" />
            </Section>

            {/* Cardiaque & Inflammatoire */}
            <Section title="Cardiaque & Inflammatoire">
              <Row label="Troponine I/T (hs)" value="< 14 ng/L" />
              <Row label="BNP" value="< 100 pg/mL (NT-proBNP < 300)" />
              <Row label="CRP" value="< 5 mg/L" />
              <Row label="Vitesse Sédimentation (VS)" value="♂ < Âge/2 | ♀ < (Âge+10)/2" />
            </Section>
            
            {/* Thyroïdien */}
            <Section title="Bilan Thyroïdien">
              <Row label="TSH" value="0.4 - 4.0 mUI/L" />
              <Row label="T4 libre (T4L)" value="10 - 20 pmol/L" />
              <Row label="T3 libre (T3L)" value="3.5 - 6.5 pmol/L" />
            </Section>

            {/* Gazométrie */}
            <Section title="Gaz du Sang (Artériel)">
              <Row label="pH" value="7.35 - 7.45" />
              <Row label="PaO2" value="80 - 100 mmHg" />
              <Row label="PaCO2" value="35 - 45 mmHg" />
              <Row label="Bicarbonates (HCO3-)" value="22 - 26 mmol/L" />
              <Row label="Lactates" value="< 2 mmol/L" />
            </Section>

            {/* Lipidique & Vitamines */}
            <Section title="Bilan Lipidique & Vitamines">
              <Row label="Cholestérol total" value="< 2.00 g/L" />
              <Row label="LDL-Cholestérol" value="< 1.60 g/L" />
              <Row label="HDL-Cholestérol" value="♂ > 0.40 g/L | ♀ > 0.50 g/L" />
              <Row label="Triglycérides" value="< 1.50 g/L" />
              <Row label="Vitamine D (25-OH)" value="30 - 100 ng/mL" />
            </Section>

            {/* LCR */}
            <Section title="Liquide Céphalo-Rachidien (LCR)">
              <Row label="Aspect" value="Eau de roche (limpide)" />
              <Row label="Cellules (Leucocytes)" value="< 5 éléments/mm³" />
              <Row label="Protéinorachie" value="0.20 - 0.40 g/L" />
              <Row label="Glycorachie" value="> 50% de la glycémie" />
            </Section>

          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-gray-50/50 rounded-2xl border border-gray-100/50 p-4">
      <h3 className="text-[13px] font-semibold text-gray-900 mb-3 uppercase tracking-wider">{title}</h3>
      <div className="divide-y divide-gray-100/50">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, indent = false }: { label: string, value: string, indent?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2 ${indent ? 'pl-4' : ''}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm text-gray-500 font-mono text-right">{value}</span>
    </div>
  )
}
