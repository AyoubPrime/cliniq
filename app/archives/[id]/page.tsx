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

export default async function ArchiveCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cas = await getCase(id)

  if (!cas) notFound()

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto mb-4">
        <Link href="/archives" className="text-sm text-blue-600 font-medium">
          ← Archives
        </Link>
      </div>
      <GameBoard cas={cas} />
    </main>
  )
}