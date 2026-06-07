'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  buildMobileSignInUrl,
  createAuthFlowId,
  isMobileDevice,
  listenForAuthPopupResult,
  openAuthSignInPopup,
} from '@/lib/auth-popup'

type AuthPopupButtonProps = {
  label?: string
  next?: string
  className?: string
}

export function AuthPopupButton({
  label = 'Iniciar sesión en ventana',
  next = '/dashboard',
  className = 'dash-cta-secondary',
}: AuthPopupButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function handleClick() {
    setError('')
    setBusy(true)

    const flowId = createAuthFlowId()

    if (isMobileDevice()) {
      router.push(buildMobileSignInUrl(flowId, next))
      setBusy(false)
      return
    }

    const popup = openAuthSignInPopup(flowId, { next })

    if (!popup) {
      setBusy(false)
      setError('Permite ventanas emergentes para continuar.')
      router.push('/login')
      return
    }

    const stopListening = listenForAuthPopupResult(flowId, (message) => {
      stopListening()
      setBusy(false)

      if (message.status === 'success') {
        router.push(message.next ?? next)
        router.refresh()
        return
      }

      if (message.status === 'error') {
        setError(message.error ?? 'No se pudo completar el acceso.')
      }
    })

    const timer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(timer)
        stopListening()
        setBusy(false)
      }
    }, 500)
  }

  return (
    <div className="auth-popup-button-wrap">
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={busy}
      >
        {busy ? 'Esperando ventana…' : label}
      </button>
      {error ? <p className="auth-popup-button-error">{error}</p> : null}
    </div>
  )
}
