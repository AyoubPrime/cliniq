import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse('<p>Lien invalide.</p>', { headers: { 'Content-Type': 'text/html' } })
  }

  const { error } = await supabase
    .from('email_subscribers')
    .update({ active: false })
    .eq('unsubscribe_token', token)

  if (error) {
    return new NextResponse('<p style="font-family:sans-serif;text-align:center;margin-top:80px;">Une erreur est survenue. Veuillez réessayer.</p>', {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"/><title>Désabonnement — CliniQ</title></head>
    <body style="font-family:-apple-system,sans-serif;background:#F5F5F7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
      <div style="text-align:center;max-width:400px;padding:32px;background:white;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <p style="font-size:32px;margin:0 0 12px;">✓</p>
        <p style="font-size:17px;font-weight:600;color:#1D1D1F;margin:0 0 8px;">Désabonnement confirmé</p>
        <p style="font-size:13px;color:#6E6E73;margin:0 0 20px;">Vous ne recevrez plus les cas quotidiens CliniQ.</p>
        <a href="https://cliniq-blond-nu.vercel.app" style="font-size:13px;color:#0066CC;text-decoration:none;">← Retourner sur CliniQ</a>
      </div>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } })
}
