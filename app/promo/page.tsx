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
        <div className="absolute inset-0 flex items-center justify-center text-[#AEAEB2] text-sm tracking-widest uppercase transition-opacity hover:opacity-70">
          Tapez l'écran pour démarrer
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center bg-white">
          
          {/* Main Logo & Tagline Container */}
          <div className="absolute flex flex-col items-center">
            
            {/* The Logo (No whitespace between Clin and iQ) */}
            <div className="flex items-baseline logo-reveal">
              <span className="text-[64px] md:text-[80px] font-semibold tracking-tight text-[#1D1D1F]">
                Clin
              </span><span className="text-[64px] md:text-[80px] font-bold tracking-tight text-[#0066CC] relative overflow-hidden">
                iQ
                {/* Premium Glass Shimmer Sweep */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 w-full h-full shimmer-sweep" />
              </span>
            </div>
            
            {/* Tagline */}
            <p className="text-[18px] md:text-[22px] text-[#AEAEB2] mt-3 tagline-reveal tracking-normal">
              L'instinct absolu.
            </p>
          </div>

          {/* Fade to white loop at the very end */}
          <div className="absolute inset-0 bg-white fade-out-loop pointer-events-none opacity-0" />
        </div>
      )}

      {/* Internal styles for Apple-esque bespoke animations */}
      <style jsx>{`
        /* 
          Apple-style reveal: 
          Starts slightly lower, blurred, and transparent.
          Eases up slowly and sharply into focus.
        */
        .logo-reveal {
          opacity: 0;
          transform: translateY(20px) scale(0.98);
          filter: blur(10px);
          animation: appleReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards, fadeOut 1.5s ease-in 7.5s forwards;
        }

        .tagline-reveal {
          opacity: 0;
          transform: translateY(15px);
          filter: blur(8px);
          /* Tagline trails slightly behind the logo */
          animation: appleReveal 3s cubic-bezier(0.16, 1, 0.3, 1) 1.2s forwards, fadeOut 1.5s ease-in 7.5s forwards;
        }

        @keyframes appleReveal {
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
            filter: blur(0px); 
          }
        }

        /* 
          Glass Shimmer: 
          Sweeps across the "iQ" after the logo has fully settled. 
        */
        .shimmer-sweep {
          transform: translateX(-150%) skewX(-25deg);
          animation: sweep 2.5s cubic-bezier(0.25, 1, 0.5, 1) 3s forwards;
        }

        @keyframes sweep {
          100% { transform: translateX(250%) skewX(-25deg); }
        }

        /* 
          Fade Out for smooth looping
        */
        @keyframes fadeOut {
          100% { opacity: 0; filter: blur(5px); }
        }

        .fade-out-loop {
          animation: fadeToWhite 1.5s ease-in 8s forwards;
        }
        
        @keyframes fadeToWhite {
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
