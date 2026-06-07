import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getServerSiteUrl } from '@/lib/auth-redirect'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function sendWithResend(params: {
  to: string
  actionLink: string
  from: string
  apiKey: string
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: 'Confirma tu cuenta en NexoLearn',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h1 style="font-size: 20px;">Confirma tu correo en NexoLearn</h1>
          <p>Haz clic en el botón para activar tu cuenta y continuar.</p>
          <p>
            <a href="${params.actionLink}" style="display:inline-block;padding:12px 20px;background:#22d3ee;color:#03111a;text-decoration:none;border-radius:8px;font-weight:700;">
              Confirmar correo
            </a>
          </p>
          <p style="font-size: 14px; color: #4b5563;">
            Si no solicitaste esta cuenta, puedes ignorar este mensaje.
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(details || 'No se pudo enviar el correo con Resend.')
  }
}

async function generateConfirmationLink(
  admin: SupabaseClient,
  email: string,
  redirectTo: string,
) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password: randomUUID(),
    options: { redirectTo },
  })

  if (error || !data?.properties?.action_link) {
    return null
  }

  return data.properties.action_link
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, message: 'Ingresa un correo electrónico válido.' },
      { status: 400 },
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFrom =
    process.env.RESEND_FROM_EMAIL ?? 'NexoLearn <onboarding@resend.dev>'

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return NextResponse.json(
      {
        ok: false,
        code: 'delivery_not_configured',
        message:
          'El envío de correos no está configurado en el servidor. Usa el reenvío de Supabase o configura RESEND_API_KEY y SUPABASE_SERVICE_ROLE_KEY.',
      },
      { status: 503 },
    )
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const redirectTo = `${getServerSiteUrl(request)}/dashboard?setup=profile`
  const actionLink = await generateConfirmationLink(admin, email, redirectTo)

  if (!actionLink) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'No encontramos una cuenta pendiente con ese correo. Regístrate primero.',
      },
      { status: 404 },
    )
  }

  try {
    await sendWithResend({
      to: email,
      actionLink,
      from: resendFrom,
      apiKey: resendApiKey,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo enviar el correo.'
    return NextResponse.json({ ok: false, message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, channel: 'server' })
}
