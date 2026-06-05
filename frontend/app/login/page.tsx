'use client'

import Link from 'next/link'
import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
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
    if (data.user) {
      router.replace('/dashboard')
    } else {
      setLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }

    setBusy(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setBusy(false)

    if (signInError) {
      setError(signInError.message)
    } else {
      router.replace('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="login-wrapper">
      <div className="login-brand">
        <div className="logo" aria-hidden="true" />
        <h1>NexoLearn</h1>
        <p>Welcome back.</p>
        <span>Continue your exchange journey.</span>
      </div>

      <div className="login-panel">
        <h2>Sign in to your account</h2>
        <p className="auth-subcopy">
          Access your matches, sessions, and progress.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="login-email">
            Email
          </label>
          <div className="input-box">
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className="field-label" htmlFor="login-password">
            Password
          </label>
          <div className="input-box">
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <button className="login-btn" type="submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          New to NexoLearn?{' '}
          <Link href="/signup" className="auth-link">
            Create your account
          </Link>
        </p>
      </div>
    </div>
  )
}
