import type { User } from '@supabase/supabase-js'
import { withAuthRateLimitRetry } from '@/lib/auth-session'
import { getEmailConfirmationRedirectUrl } from '@/lib/auth-redirect'
import { isAuthRateLimited, translateAuthError } from '@/lib/auth-messages'
import { supabase } from '@/lib/supabase'

export type SendConfirmationResult =
  | { ok: true; channel: 'resend' | 'server' }
  | { ok: false; message: string }

async function sendConfirmationViaClient(email: string): Promise<SendConfirmationResult> {
  const emailRedirectTo = getEmailConfirmationRedirectUrl()

  const { error } = await withAuthRateLimitRetry(() =>
    supabase.auth.resend({
      type: 'signup',
      email,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    }),
  )

  if (error) {
    if (isAuthRateLimited(error.message)) {
      return {
        ok: false,
        message:
          'Supabase limita el envío de correos. Espera unos minutos antes de reenviar.',
      }
    }

    return {
      ok: false,
      message: translateAuthError(error.message),
    }
  }

  return { ok: true, channel: 'resend' }
}

export async function sendConfirmationEmail(
  email: string,
): Promise<SendConfirmationResult> {
  try {
    const response = await fetch('/api/auth/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; message?: string; channel?: 'resend' | 'server' }
      | null

    if (response.ok && payload?.ok) {
      return { ok: true, channel: payload.channel ?? 'server' }
    }

    if (response.status === 503) {
      return sendConfirmationViaClient(email)
    }

    if (payload?.message) {
      return { ok: false, message: payload.message }
    }
  } catch {
    return sendConfirmationViaClient(email)
  }

  return sendConfirmationViaClient(email)
}

export function isDuplicateSignupUser(user: User | null): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0)
}
