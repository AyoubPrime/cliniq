import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

console.log("CALLBACK URL:", request.url)
console.log("CODE:", code)

  if (code) {
    const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const { data, error } = await supabase.auth.exchangeCodeForSession(code)

if (data.session) {
  await supabase.auth.setSession(data.session)
}

console.log("AUTH DATA:", data)
console.log("AUTH ERROR:", error)

    if (data.user) {
      console.log("USER FOUND:", data.user.email)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!existing) {
        const { error: insertError } = await supabase.from('profiles').insert({
  id: data.user.id,
  email: data.user.email,
  display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
  avatar_url: data.user.user_metadata?.avatar_url,
  streak: 0,
  last_played: null,
  total_cases_played: 0,
})

console.log("INSERT PROFILE ERROR:", insertError)
      }
    }
  }

  return NextResponse.redirect(new URL('/', request.url))
}