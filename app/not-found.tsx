import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mb-6">
          <span className="text-xl font-semibold tracking-tight text-[#1D1D1F]">Clin</span>
          <span className="text-xl font-bold tracking-tight text-[#0066CC]">iQ</span>
        </div>

        <p className="text-4xl font-semibold text-gray-900 mb-2">404</p>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Cette page n'existe pas ou le cas clinique est introuvable.
        </p>

        <Link
          href="/"
          className="inline-block bg-[#0066CC] text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#0055AA] transition-colors"
        >
          Retour au cas du jour
        </Link>
      </div>
    </main>
  )
}
