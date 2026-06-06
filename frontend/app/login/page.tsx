'use client'

import Link from 'next/link'
import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { getLocalUser, withAuthRateLimitRetry } from '@/lib/auth-session'
import { translateAuthError } from '@/lib/auth-messages'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('reset') === 'success') {
        setSuccess('Tu contraseña se actualizó correctamente. Inicia sesión.')
        window.history.replaceState({}, '', '/login')
      }
    }
    checkSession()
  }, [])

  async function checkSession() {
    const user = await getLocalUser()
    if (user?.email_confirmed_at) {
      router.replace('/dashboard')
    } else {
      setLoading(false)
    }
  }

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
        router.push(`/confirm-email?email=${encodeURIComponent(email)}`)
        return
      }
      setError(msg)
      return
    }

    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      router.push(`/confirm-email?email=${encodeURIComponent(email)}`)
      return
    }

    router.replace('/dashboard')
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Cargando…</p>
      </div>
    )
  }

  return (
    <div className="login-wrapper">
      <div className="login-brand">
        <div className="logo" aria-hidden="true" />
        <h1>NexoLearn</h1>
        <p>Bienvenido de nuevo.</p>
        <span>Continúa tu camino de intercambio de conocimiento.</span>
      </div>

      <div className="login-panel">
        <h2>Inicia sesión en tu cuenta</h2>
        <p className="auth-subcopy">
          Accede a tus conexiones, sesiones y progreso.
        </p>

        <form onSubmit={handleSubmit}>
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
            <Link href="/forgot-password" className="auth-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>

          <AuthNotice variant="success" message={success} />
          <AuthNotice variant="error" message={error} />

          <button className="login-btn" type="submit" disabled={busy}>
            {busy ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-switch">
          ¿Nuevo en NexoLearn?{' '}
          <Link href="/signup" className="auth-link">
            Crea tu cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
