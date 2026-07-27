'use client'

import { useState } from 'react'

export default function PromoAnimation() {
  const [playing, setPlaying] = useState(false)

  return (
    <div 
      className="fixed inset-0 bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none"
      onClick={() => setPlaying(true)}
    >
      {!playing ? (
        <div className="absolute inset-0 flex items-center justify-center text-[#AEAEB2] text-sm tracking-widest uppercase">
          Tapez l'écran pour démarrer
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Phase 1: Heartbeat Dot */}
          <div className="absolute w-4 h-4 bg-[#0066CC] rounded-full dot-animation shadow-[0_0_20px_rgba(0,102,204,0.6)]" />
          
          {/* Phase 2: Radar Expansion */}
          <div className="absolute w-[200px] h-[200px] border-[2px] border-[#0066CC] rounded-full radar-animation opacity-0" />
          <div className="absolute w-[300px] h-[300px] border-[1px] border-[#0066CC] rounded-full radar-animation-2 opacity-0" />

          {/* Phase 3 & 4: Logo Snap & Hold */}
          <div className="absolute flex flex-col items-center">
            <div className="flex items-baseline overflow-hidden">
              <span className="text-[64px] md:text-[80px] font-semibold tracking-tight text-[#1D1D1F] clin-animation opacity-0 transform -translate-x-[100px]">Clin</span>
              <span className="text-[64px] md:text-[80px] font-bold tracking-tight text-[#0066CC] relative iq-animation opacity-0 transform translate-x-[100px]">
                iQ
                {/* Glow sweep effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 w-full h-full sweep-animation" />
              </span>
            </div>
            
            <p className="text-[18px] md:text-[22px] text-[#AEAEB2] mt-2 tagline-animation opacity-0 tracking-normal">
              L'instinct absolu.
            </p>
          </div>

          {/* Fade out to white at the end */}
          <div className="absolute inset-0 bg-white fade-out-animation pointer-events-none opacity-0" />
        </div>
      )}

      {/* Internal styles for complex keyframes */}
      <style jsx>{`
        /* 0s to 2s: Heartbeat */
        .dot-animation {
          animation: heartbeat 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes heartbeat {
          0% { transform: scale(0); opacity: 0; }
          20% { transform: scale(1); opacity: 1; }
          30% { transform: scale(1.3); }
          40% { transform: scale(1); }
          50% { transform: scale(1.3); }
          60% { transform: scale(1); opacity: 1; }
          80% { transform: scale(30); opacity: 0; }
          100% { transform: scale(30); opacity: 0; }
        }

        /* 1.5s to 3s: Radar expanding outwards as dot disappears */
        .radar-animation {
          animation: radarExpand 1.5s ease-out 1.5s forwards;
        }
        .radar-animation-2 {
          animation: radarExpand 1.5s ease-out 1.7s forwards;
        }
        @keyframes radarExpand {
          0% { transform: scale(0.1); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }

        /* 2.5s to 4.5s: Logo slide in */
        .clin-animation {
          animation: slideInLeft 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 2.5s forwards, fadeOut 1s ease-in 9s forwards;
        }
        .iq-animation {
          animation: slideInRight 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 2.5s forwards, fadeOut 1s ease-in 9s forwards;
        }
        @keyframes slideInLeft {
          0% { transform: translateX(-100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        /* 4.5s to 7s: Tagline fade in and track out */
        .tagline-animation {
          animation: trackOut 2.5s cubic-bezier(0.2, 0, 0.2, 1) 4s forwards, fadeOut 1s ease-in 9s forwards;
        }
        @keyframes trackOut {
          0% { opacity: 0; letter-spacing: 0em; transform: translateY(10px); }
          100% { opacity: 1; letter-spacing: 0.15em; transform: translateY(0); }
        }

        /* 7s to 9s: Subtle light sweep over iQ */
        .sweep-animation {
          transform: translateX(-100%);
          animation: sweep 2s ease-in-out 7s forwards;
        }
        @keyframes sweep {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }

        /* 9.5s to 10.5s: Fade entire screen to white for a clean loop */
        .fade-out-animation {
          animation: fadeToWhite 1s ease-in 9.5s forwards;
        }
        @keyframes fadeToWhite {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
