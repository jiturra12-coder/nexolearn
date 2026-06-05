'use client'

import Link from 'next/link'
import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setBusy(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setBusy(false)
      setError(signUpError.message)
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
        setBusy(false)
        setError('Account created but profile setup failed. Try signing in.')
        return
      }
    }

    setBusy(false)
    router.replace('/onboarding')
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="signup-wrapper">
      <header className="signup-header">
        <p className="signup-eyebrow">NexoLearn</p>
        <h1>Create your NexoLearn account.</h1>
        <ul className="signup-pillars" aria-label="What you can do on NexoLearn">
          <li>
            <span className="pillar-label">Learn.</span>
            <span className="pillar-detail">Set goals and find peers who can help.</span>
          </li>
          <li>
            <span className="pillar-label">Teach.</span>
            <span className="pillar-detail">Share what you know in reciprocal sessions.</span>
          </li>
          <li>
            <span className="pillar-label">Build your reputation.</span>
            <span className="pillar-detail">Earn trust through real exchanges and reviews.</span>
          </li>
        </ul>
      </header>

      <div className="signup-panel">
        <h2>Get started</h2>
        <p className="auth-subcopy signup-subcopy">
          Next you will add skills you teach and topics you want to learn.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="signup-email">
            Email
          </label>
          <div className="input-box signup-input">
            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className="field-label" htmlFor="signup-password">
            Password
          </label>
          <div className="input-box signup-input">
            <input
              id="signup-password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <button className="signup-btn" type="submit" disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
