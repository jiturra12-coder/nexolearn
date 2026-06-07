'use client'

import { useEffect, useRef, useState } from 'react'
import { sendConfirmationEmail } from '@/lib/auth-email'
import { getWebmailUrl } from '@/lib/auth-messages'
import { AuthNotice } from '@/components/auth/AuthNotice'

type EmailVerificationModalProps = {
  email: string
  autoSend?: boolean
  onConfirmed: () => void
}

export function EmailVerificationModal({
  email,
  autoSend = true,
  onConfirmed,
}: EmailVerificationModalProps) {
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const autoSendStarted = useRef(false)

  useEffect(() => {
    if (!autoSend || !email || autoSendStarted.current) return
    autoSendStarted.current = true
    void deliverEmail('auto')
  }, [autoSend, email])

  async function deliverEmail(mode: 'auto' | 'manual') {
    if (mode === 'manual') {
      setSuccess('')
      setError('')
    }

    setBusy(true)
    const result = await sendConfirmationEmail(email)
    setBusy(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setSuccess(
      result.channel === 'server'
        ? 'Correo de confirmación enviado correctamente.'
        : 'Solicitud registrada. Si no llega en unos minutos, revisa spam o usa Reenviar.',
    )
  }

  function handleOpenEmail() {
    if (!email) return
    window.open(getWebmailUrl(email), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="verify-email-title">
      <div className="auth-modal-card confirm-email-panel">
        <p className="signup-eyebrow">Paso 2 de 4</p>

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

        <h2 id="verify-email-title">Revisa tu correo electrónico</h2>
        <p className="auth-subcopy confirm-email-message">
          {busy
            ? 'Estamos enviando el enlace de confirmación…'
            : success
              ? 'Haz clic en el enlace del correo para activar tu cuenta y continuar en el dashboard.'
              : 'Te enviaremos un enlace de confirmación para activar tu cuenta.'}
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
            onClick={() => deliverEmail('manual')}
            disabled={busy || !email}
          >
            {busy ? 'Enviando…' : 'Reenviar correo de confirmación'}
          </button>
          <button
            type="button"
            className="auth-btn-ghost"
            onClick={onConfirmed}
          >
            Ya confirmé mi correo
          </button>
        </div>
      </div>
    </div>
  )
}
