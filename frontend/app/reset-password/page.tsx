'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { translateAuthError } from '@/lib/auth-messages'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function establishRecoverySession() {
      const code = searchParams.get('code')

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)
        if (!cancelled) {
          if (exchangeError) {
            setError(
              'El enlace no es válido o ha expirado. Solicita uno nuevo.',
            )
            setChecking(false)
            return
          }
          setError('')
          setReady(true)
          setChecking(false)
        }
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!cancelled) {
        if (data.session) {
          setError('')
          setReady(true)
        }
        setChecking(false)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setError('')
        setReady(true)
        setChecking(false)
      }
    })

    establishRecoverySession()

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setChecking((prev) => {
          if (prev) {
            setError((current) =>
              current ||
              'El enlace no es válido o ha expirado. Solicita uno nuevo.',
            )
          }
          return false
        })
      }
    }, 4000)

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
      window.clearTimeout(timeout)
    }
  }, [searchParams])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('Completa ambos campos de contraseña.')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setBusy(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setBusy(false)
      setError(translateAuthError(updateError.message))
      return
    }

    await supabase.auth.signOut()
    router.replace('/login?reset=success')
  }

  if (checking) {
    return (
      <div className="auth-loading">
        <p>Verificando enlace…</p>
      </div>
    )
  }

  return (
    <div className="login-wrapper">
      <div className="login-brand">
        <div className="logo" aria-hidden="true" />
        <h1>NexoLearn</h1>
        <p>Nueva contraseña.</p>
        <span>Elige una contraseña segura para tu cuenta.</span>
      </div>

      <div className="login-panel">
        <h2>Restablecer contraseña</h2>

        {ready ? (
          <>
            <p className="auth-subcopy">
              Ingresa tu nueva contraseña. Después podrás iniciar sesión con
              ella.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="reset-password">
                Nueva contraseña
              </label>
              <PasswordInput
                id="reset-password"
                name="password"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />

              <label className="field-label" htmlFor="reset-password-confirm">
                Confirmar contraseña
              </label>
              <PasswordInput
                id="reset-password-confirm"
                name="confirmPassword"
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              <AuthNotice variant="error" message={error} />

              <button className="login-btn" type="submit" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-subcopy">
              No pudimos validar tu enlace de recuperación.
            </p>
            <AuthNotice variant="error" message={error} />
            <Link href="/forgot-password" className="login-btn auth-link-btn">
              Solicitar nuevo enlace
            </Link>
          </>
        )}

        <p className="auth-switch">
          <Link href="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <p>Cargando…</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
