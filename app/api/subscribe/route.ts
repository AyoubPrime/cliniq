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
    // Simple token — compatible with all Node.js versions
    const token = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`

    const { error } = await supabase
      .from('email_subscribers')
      .insert({ email: cleanEmail, unsubscribe_token: token, active: true })

    // If duplicate email, treat as success (already subscribed)
    if (error && error.code === '23505') {
      return NextResponse.json({ success: true })
    }

    if (error) {
      // Return detailed error temporarily for debugging
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
