'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { translateAuthError } from '@/lib/auth-messages'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError('Ingresa tu correo electrónico.')
      return
    }

    setBusy(true)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setBusy(false)

    if (resetError) {
      setError(translateAuthError(resetError.message))
      return
    }

    setSuccess('Te hemos enviado un enlace para restablecer tu contraseña.')
  }

  return (
    <div className="login-wrapper">
      <div className="login-brand">
        <div className="logo" aria-hidden="true" />
        <h1>NexoLearn</h1>
        <p>Recupera el acceso a tu cuenta.</p>
        <span>Te enviaremos un enlace seguro a tu correo.</span>
      </div>

      <div className="login-panel">
        <h2>Recuperar contraseña</h2>
        <p className="auth-subcopy">
          Ingresa el correo con el que te registraste. Recibirás un enlace para
          crear una nueva contraseña.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="forgot-email">
            Correo electrónico
          </label>
          <div className="input-box">
            <input
              id="forgot-email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <AuthNotice variant="error" message={error} />
          <AuthNotice variant="success" message={success} />

          <button className="login-btn" type="submit" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <p className="auth-switch">
          <Link href="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
