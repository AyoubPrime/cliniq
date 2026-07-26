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

    // Generate a simple unsubscribe token
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64url')

    const { error } = await supabase
      .from('email_subscribers')
      .upsert({ email: email.toLowerCase().trim(), unsubscribe_token: token, active: true }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })

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
