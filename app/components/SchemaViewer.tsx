type ApproachStep = {
  step: number
  title: string
  detail: string
}

export default function DiagnosticApproach({ steps }: { steps: ApproachStep[] }) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8ED] p-5 mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#AEAEB2] mb-4">
        Approche diagnostique
      </p>
      <div className="relative">
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[#EBF4FF]" />
        <div className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 items-start relative">
              <div className="w-9 h-9 rounded-full bg-[#EBF4FF] border border-[#C7DEFF] flex items-center justify-center flex-shrink-0 z-10">
                <span className="text-xs font-bold text-[#0066CC]">{s.step}</span>
              </div>
              <div className="flex-1 pb-1 pt-1.5">
                <p className="text-sm font-semibold text-[#1D1D1F] mb-0.5">{s.title}</p>
                <p className="text-xs text-[#6E6E73] leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}