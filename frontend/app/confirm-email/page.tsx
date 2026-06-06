'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { ActivationProgress } from '@/components/auth/ActivationProgress'
import { getWebmailUrl } from '@/lib/auth-messages'

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const fromQuery = searchParams.get('email')
    const fromStorage =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('nexolearn_pending_email')
        : null

    const resolved = fromQuery ?? fromStorage ?? ''
    setEmail(resolved)
    setChecking(false)

    if (resolved && typeof window !== 'undefined') {
      sessionStorage.setItem('nexolearn_pending_email', resolved)
    }
  }, [searchParams])

  useEffect(() => {
    async function checkConfirmed() {
      const { data } = await supabase.auth.getUser()
      if (data.user?.email_confirmed_at) {
        router.replace('/onboarding')
      }
    }

    if (!checking) {
      checkConfirmed()
    }
  }, [checking, router])

  async function handleResend() {
    setSuccess('')
    setError('')

    if (!email) {
      setError('No encontramos tu correo. Regístrate de nuevo.')
      return
    }

    setBusy(true)

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    setBusy(false)

    if (resendError) {
      setError('No pudimos enviar el correo de confirmación. Inténtalo nuevamente.')
      return
    }

    setSuccess('Correo de confirmación enviado correctamente.')
  }

  function handleOpenEmail() {
    if (!email) return
    const url = getWebmailUrl(email)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (checking) {
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
        <h1>Activa tu cuenta.</h1>
        <p className="confirm-email-lead">
          Un paso más para comenzar a aprender y enseñar con la comunidad.
        </p>
      </header>

      <div className="signup-panel confirm-email-panel">
        <ActivationProgress currentStep={2} />

        <div className="confirm-email-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M3 7l9 6 9-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2>Revisa tu correo electrónico</h2>
        <p className="auth-subcopy confirm-email-message">
          Hemos enviado un enlace de confirmación a tu correo electrónico.
          <br />
          <br />
          Haz clic en el enlace para activar tu cuenta y comenzar a utilizar
          NexoLearn.
        </p>

        {email ? (
          <p className="confirm-email-address">
            Enviado a: <strong>{email}</strong>
          </p>
        ) : null}

        <AuthNotice variant="success" message={success} />
        <AuthNotice variant="error" message={error} />

        <div className="confirm-email-actions">
          <button
            type="button"
            className="signup-btn"
            onClick={handleOpenEmail}
            disabled={!email}
          >
            Abrir correo
          </button>
          <button
            type="button"
            className="auth-btn-secondary"
            onClick={handleResend}
            disabled={busy || !email}
          >
            {busy ? 'Enviando…' : 'Reenviar correo de confirmación'}
          </button>
          <Link href="/login" className="auth-btn-ghost">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <p>Cargando…</p>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  )
}
