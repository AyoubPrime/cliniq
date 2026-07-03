type ApproachStep = {
  step: number
  title: string
  detail: string
}

export default function DiagnosticApproach({ steps }: { steps: ApproachStep[] }) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">
        Approche diagnostique
      </p>
      <div className="relative">
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-blue-100" />
        <div className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 items-start relative">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 z-10">
                <span className="text-xs font-semibold text-blue-600">{s.step}</span>
              </div>
              <div className="flex-1 pb-1">
                <p className="text-sm font-medium text-gray-900 mb-0.5">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}