import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import GameBoard from '@/app/components/GameBoard'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getCase(id: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error) return null
  return data
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const cas = await getCase(id)

  if (!cas) return {}

  const sex = cas.sex === 'M' ? 'masculin' : 'féminin'
  const description = `Patient de ${cas.age} ans (${sex}), ${cas.setting}. Motif : ${cas.chief_complaint}. Analysez les indices et posez le bon diagnostic.`

  return {
    title: `CliniQ — ${cas.specialty} · Cas d'archive`,
    description,
    openGraph: {
      title: `CliniQ — ${cas.specialty} · Cas d'archive`,
      description,
      images: [{ url: '/og-image-brand.jpg', width: 1200, height: 675 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `CliniQ — ${cas.specialty} · Cas d'archive`,
      description,
      images: ['/og-image-brand.jpg'],
    },
  }
}


export default async function ArchiveCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cas = await getCase(id)

  if (!cas) notFound()

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto mb-4">
        <Link href="/archives" className="text-xs font-semibold text-[#0066CC] hover:text-[#0055AA] transition-colors">
          ← Archives
        </Link>
      </div>
      <GameBoard cas={cas} />
    </main>
  )
}