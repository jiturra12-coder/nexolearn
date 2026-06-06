'use client'

import Link from 'next/link'
import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { ActivationProgress } from '@/components/auth/ActivationProgress'
import { translateAuthError } from '@/lib/auth-messages'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    const { data } = await supabase.auth.getUser()
    if (data.user?.email_confirmed_at) {
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

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setBusy(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setBusy(false)
      setError(translateAuthError(signUpError.message))
      return
    }

    const user = data.user

    if (user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          email: user.email,
        },
      ])

      if (profileError) {
        console.error(profileError)
      }
    }

    setBusy(false)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nexolearn_pending_email', email)
    }

    router.push(`/confirm-email?email=${encodeURIComponent(email)}`)
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Cargando…</p>
      </div>
    )
  }

  return (
    <div className="signup-wrapper">
      <header className="signup-header">
        <p className="signup-eyebrow">NexoLearn</p>
        <h1>Crea tu cuenta en NexoLearn.</h1>
        <ul className="signup-pillars" aria-label="Qué puedes hacer en NexoLearn">
          <li>
            <span className="pillar-label">Aprender.</span>
            <span className="pillar-detail">
              Define objetivos y encuentra personas que puedan ayudarte.
            </span>
          </li>
          <li>
            <span className="pillar-label">Enseñar.</span>
            <span className="pillar-detail">
              Comparte lo que sabes en sesiones de intercambio.
            </span>
          </li>
          <li>
            <span className="pillar-label">Construir reputación.</span>
            <span className="pillar-detail">
              Gana confianza con intercambios reales y reseñas.
            </span>
          </li>
        </ul>
      </header>

      <div className="signup-panel">
        <ActivationProgress currentStep={1} />

        <h2>Comenzar</h2>
        <p className="auth-subcopy signup-subcopy">
          Después confirmarás tu correo y completarás tu perfil.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="signup-email">
            Correo electrónico
          </label>
          <div className="input-box signup-input">
            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className="field-label" htmlFor="signup-password">
            Contraseña
          </label>
          <PasswordInput
            id="signup-password"
            name="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            boxClassName="signup-input"
          />

          <AuthNotice variant="error" message={error} />

          <button className="signup-btn" type="submit" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="auth-link">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
