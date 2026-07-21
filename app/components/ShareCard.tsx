'use client'

import { useRef, useState } from 'react'

// Abbreviation map for all French medical specialties
const SPECIALTY_ABBR: Record<string, string> = {
  'Cardiologie': 'Cardio.',
  'Pneumologie': 'Pneumo.',
  'Gastroentérologie': 'Gastro.',
  'Neurologie': 'Neuro.',
  'Dermatologie': 'Dermato.',
  'Endocrinologie': 'Endocrino.',
  'Hématologie': 'Hémato.',
  'Rhumatologie': 'Rhumato.',
  'Néphrologie': 'Néphro.',
  'Urologie': 'Uro.',
  'Gynécologie': 'Gynéco.',
  'Pédiatrie': 'Pédiat.',
  'Chirurgie': 'Chirur.',
  'Orthopédie': 'Ortho.',
  'Ophtalmologie': 'Ophtalmo.',
  'ORL': 'ORL',
  'Infectiologie': 'Infect.',
  'Réanimation': 'Réanim.',
  'Urgences': 'Urgences',
  'Psychiatrie': 'Psy.',
  'Médecine interne': 'Med. Int.',
  'Oncologie': 'Onco.',
  'Radiologie': 'Radio.',
  'Gériatrie': 'Géria.',
  'Immunologie': 'Immuno.',
}

function abbr(name: string): string {
  if (SPECIALTY_ABBR[name]) return SPECIALTY_ABBR[name]
  // Fallback: first 7 chars + dot
  return name.length > 8 ? name.substring(0, 7) + '.' : name
}

// Pure SVG radar chart — no external library needed
function RadarSVG({ data }: { data: Array<{ name: string; value: number }> }) {
  const size = 200
  const center = size / 2
  const maxRadius = 62
  const n = data.length
  if (n < 3) return null

  const getPoint = (index: number, radius: number) => {
    const angle = (index * 2 * Math.PI / n) - Math.PI / 2
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid polygons */}
      {gridLevels.map(level => {
        const pts = data.map((_, i) => {
          const p = getPoint(i, level * maxRadius)
          return `${p.x},${p.y}`
        }).join(' ')
        return <polygon key={level} points={pts} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      })}

      {/* Axis lines */}
      {data.map((_, i) => {
        const outer = getPoint(i, maxRadius)
        return <line key={i} x1={center} y1={center} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      })}

      {/* Data polygon */}
      <polygon
        points={data.map((d, i) => {
          const p = getPoint(i, (d.value / 100) * maxRadius)
          return `${p.x},${p.y}`
        }).join(' ')}
        fill="#0066CC"
        fillOpacity="0.45"
        stroke="#4D9EE8"
        strokeWidth="1.5"
      />

      {/* Data dots */}
      {data.map((d, i) => {
        const p = getPoint(i, (d.value / 100) * maxRadius)
        return <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#4D9EE8" />
      })}

      {/* Labels */}
      {data.map((d, i) => {
        const p = getPoint(i, maxRadius + 18)
        const anchor = p.x < center - 5 ? 'end' : p.x > center + 5 ? 'start' : 'middle'
        return (
          <text
            key={i}
            x={p.x} y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize="8"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontWeight="500"
          >
            {abbr(d.name)}
          </text>
        )
      })}
    </svg>
  )
}

export default function ShareCard({
  name,
  overallScore,
  bestSpecialty,
  totalCases,
  winRate,
  streak,
  specialtyList,
}: {
  name: string
  overallScore: number
  bestSpecialty: string
  totalCases: number
  winRate: number
  streak: number
  specialtyList: Array<{ specialty: string; winRate: number; total: number }>
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const top6 = specialtyList.slice(0, 6).map(s => ({
    name: s.specialty,
    value: s.winRate,
  }))

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = `cliniq-${name.split(' ')[0].toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="mb-8 flex flex-col items-center">
      {/* Card */}
      <div
        ref={cardRef}
        style={{
          background: 'linear-gradient(155deg, #0A1628 0%, #0D2347 55%, #091B38 100%)',
          borderRadius: 20,
          padding: 24,
          width: 300,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0, 102, 204, 0.35), 0 0 0 1px rgba(255,255,255,0.07)',
        }}
      >
        {/* Glow blob */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,102,204,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top row: branding + score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
              Profil Clinique
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: 'white' }}>Clin</span>
              <span style={{ color: '#4D9EE8' }}>iQ</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 54, fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {overallScore}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Score
            </div>
          </div>
        </div>

        {/* Name + best specialty badge */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 6 }}>
            {name}
          </div>
          {bestSpecialty && (
            <div style={{
              display: 'inline-block',
              background: 'rgba(0,102,204,0.25)',
              border: '1px solid rgba(77,158,232,0.35)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              color: '#4D9EE8',
              fontWeight: 600,
            }}>
              🏅 {bestSpecialty}
            </div>
          )}
        </div>

        {/* Radar chart */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          {top6.length >= 3 ? (
            <RadarSVG data={top6} />
          ) : (
            <div style={{
              width: 170, height: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center',
            }}>
              Jouez 3+ spécialités pour débloquer
            </div>
          )}
        </div>

        {/* Bottom stats */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 14,
        }}>
          {[
            { label: 'Cas joués', value: String(totalCases) },
            { label: 'Réussite', value: `${winRate}%` },
            { label: 'Série', value: `🔥 ${streak}j` },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* URL watermark */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 }}>
            cliniq-blond-nu.vercel.app
          </span>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="mt-4 flex items-center gap-2 bg-[#0066CC] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#0055AA] active:scale-95 transition-all disabled:opacity-50"
      >
        {downloading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Génération...
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger ma carte
          </>
        )}
      </button>
    </div>
  )
}
