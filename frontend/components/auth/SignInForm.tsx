'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { withAuthRateLimitRetry } from '@/lib/auth-session'
import { completeAuthPopup } from '@/lib/auth-popup'
import { translateAuthError } from '@/lib/auth-messages'

type SignInFormProps = {
  popupMode?: boolean
  flowId?: string | null
  nextPath?: string | null
  compact?: boolean
}

function appendPopupParams(
  href: string,
  popupMode: boolean,
  flowId?: string | null,
  nextPath?: string | null,
) {
  if (!popupMode || !flowId) return href

  const [path, hash = ''] = href.split('#')
  const params = new URLSearchParams()
  params.set('flowId', flowId)
  if (typeof window !== 'undefined') {
    const mobile = new URLSearchParams(window.location.search).get('mobile')
    if (mobile === '1') {
      params.set('mobile', '1')
    } else {
      params.set('popup', '1')
    }
  } else {
    params.set('popup', '1')
  }
  if (nextPath) params.set('next', nextPath)

  const joiner = path.includes('?') ? '&' : '?'
  return `${path}${joiner}${params.toString()}${hash ? `#${hash}` : ''}`
}

export function SignInForm({
  popupMode = false,
  flowId = null,
  nextPath = null,
  compact = false,
}: SignInFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Ingresa tu correo electrónico y contraseña.')
      return
    }

    setBusy(true)

    const { data, error: signInError } = await withAuthRateLimitRetry(() =>
      supabase.auth.signInWithPassword({ email, password }),
    )

    setBusy(false)

    if (signInError) {
      const msg = translateAuthError(signInError.message)
      if (msg.includes('Confirma tu correo')) {
        const confirmUrl = appendPopupParams(
          `/confirm-email?email=${encodeURIComponent(email)}&send=1`,
          popupMode,
          flowId,
          nextPath,
        )
        router.push(confirmUrl)
        return
      }
      setError(msg)
      return
    }

    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      const confirmUrl = appendPopupParams(
        `/confirm-email?email=${encodeURIComponent(email)}&send=1`,
        popupMode,
        flowId,
        nextPath,
      )
      router.push(confirmUrl)
      return
    }

    const destination = nextPath ?? '/dashboard'

    if (popupMode && flowId) {
      completeAuthPopup(flowId, { status: 'success', next: destination })
      return
    }

    router.replace(destination)
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'signin-popup-form' : undefined}>
      {!compact ? (
        <>
          <h2>Inicia sesión en tu cuenta</h2>
          <p className="auth-subcopy">
            Accede a tus conexiones, sesiones y progreso.
          </p>
        </>
      ) : (
        <>
          <h2 className="signin-popup-title">Inicia sesión</h2>
          <p className="auth-subcopy signin-popup-copy">
            Completa el acceso en esta ventana para volver a NexoLearn.
          </p>
        </>
      )}

      <label className="field-label" htmlFor="login-email">
        Correo electrónico
      </label>
      <div className="input-box">
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <label className="field-label" htmlFor="login-password">
        Contraseña
      </label>
      <PasswordInput
        id="login-password"
        name="password"
        placeholder="Tu contraseña"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />

      <p className="auth-forgot-row">
        <Link
          href={appendPopupParams('/forgot-password', popupMode, flowId, nextPath)}
          className="auth-link"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <AuthNotice variant="success" message={success} />
      <AuthNotice variant="error" message={error} />

      <button className="login-btn" type="submit" disabled={busy}>
        {busy ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </button>

      <p className="auth-switch">
        ¿Nuevo en NexoLearn?{' '}
        <Link
          href={appendPopupParams('/signup', popupMode, flowId, nextPath)}
          className="auth-link"
        >
          Crea tu cuenta
        </Link>
      </p>
    </form>
  )
}
