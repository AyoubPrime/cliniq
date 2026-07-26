import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const token = Buffer.from(`${cleanEmail}:${Date.now()}`).toString('base64url')

    const { error } = await supabase
      .from('email_subscribers')
      .insert({ email: cleanEmail, unsubscribe_token: token, active: true })

    // If duplicate email, treat as success (already subscribed)
    if (error && error.code === '23505') {
      return NextResponse.json({ success: true })
    }

    if (error) {
      console.error('Subscribe error:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
