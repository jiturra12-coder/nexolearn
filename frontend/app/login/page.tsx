'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignInForm } from '@/components/auth/SignInForm'
import { getLocalUser } from '@/lib/auth-session'

export default function LoginPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
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
        <SignInForm />
      </div>
    </div>
  )
}
