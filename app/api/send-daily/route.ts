import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getAlgiersDateString } from '@/lib/date'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cliniq-blond-nu.vercel.app'

function buildEmailHtml(cas: any, unsubscribeToken: string): string {
  const sex = cas.sex === 'M' ? 'Homme' : 'Femme'
  const unsubscribeUrl = `${APP_URL}/api/unsubscribe?token=${unsubscribeToken}`
  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'Africa/Algiers'
  })
  // Capitalize first letter
  const dateStr = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CliniQ — Cas du jour</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:20px;font-weight:600;color:#1D1D1F;letter-spacing:-0.5px;">Clin</span><span style="font-size:20px;font-weight:700;color:#0066CC;letter-spacing:-0.5px;">iQ</span>
              <p style="margin:4px 0 0;font-size:11px;color:#AEAEB2;letter-spacing:0.02em;">L'instinct absolu.</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;padding:28px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

              <!-- Date + specialty -->
              <p style="margin:0 0 6px;font-size:11px;color:#AEAEB2;text-transform:uppercase;letter-spacing:0.08em;">${dateStr}</p>
              <div style="display:inline-block;background:#EBF4FF;border:1px solid #C7DEFF;border-radius:20px;padding:3px 12px;margin-bottom:18px;">
                <span style="font-size:11px;font-weight:600;color:#0066CC;">${cas.specialty}</span>
              </div>

              <!-- Patient briefing -->
              <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1D1D1F;letter-spacing:-0.3px;">Cas du jour</h2>
              <p style="margin:0 0 16px;font-size:14px;color:#6E6E73;line-height:1.6;">
                <strong style="color:#1D1D1F;">${sex}, ${cas.age} ${cas.age_unit || 'ans'}</strong> — ${cas.setting}<br/>
                <em style="color:#3A3A3C;">"${cas.chief_complaint}"</em>
              </p>

              <!-- Divider -->
              <div style="height:1px;background:#F0F0F5;margin:18px 0;"></div>

              <!-- CTA -->
              <p style="margin:0 0 18px;font-size:13px;color:#6E6E73;">
                Analysez les indices cliniques et posez votre diagnostic. Un résumé complet vous attend à la fin.
              </p>
              <a href="${APP_URL}" style="display:block;text-align:center;background:#0066CC;color:#FFFFFF;font-size:15px;font-weight:600;padding:14px 24px;border-radius:14px;text-decoration:none;letter-spacing:-0.2px;">
                Analyser ce cas →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#AEAEB2;">
                Vous recevez cet email car vous êtes abonné(e) aux cas quotidiens CliniQ.<br/>
                <a href="${unsubscribeUrl}" style="color:#AEAEB2;text-decoration:underline;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function handler(req: NextRequest) {
  // Verify this is called by our cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get today's case
    const today = getAlgiersDateString()
    const { data: cas, error: casError } = await supabase
      .from('cases')
      .select('*')
      .eq('status', 'published')
      .lte('publish_date', today)
      .order('publish_date', { ascending: false })
      .limit(1)
      .single()

    if (casError || !cas) {
      return NextResponse.json({ error: 'No case found for today' }, { status: 404 })
    }

    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('email_subscribers')
      .select('email, unsubscribe_token')
      .eq('active', true)

    if (subError || !subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers', sent: 0 })
    }

    // Send emails
    let sent = 0
    const errors: string[] = []

    for (const sub of subscribers) {
      try {
        await resend.emails.send({
          from: 'CliniQ <onboarding@resend.dev>',
          to: sub.email,
          subject: `🩺 Votre cas du jour — ${cas.specialty}`,
          html: buildEmailHtml(cas, sub.unsubscribe_token || ''),
        })
        sent++
      } catch (e: any) {
        errors.push(`${sub.email}: ${e.message}`)
      }
    }

    return NextResponse.json({ success: true, sent, errors })
  } catch (e) {
    console.error('Send daily error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET for Vercel cron, POST for manual admin trigger
export const GET = handler
export const POST = handler

