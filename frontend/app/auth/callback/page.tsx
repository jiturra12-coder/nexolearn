'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLocalUser } from '@/lib/auth-session'
import {
  completeAuthPopup,
  parseFlowId,
  readStashedAuthFlowId,
} from '@/lib/auth-popup'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Validando acceso…')

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      const code = searchParams.get('code')
      const flowId =
        parseFlowId(window.location.search) ?? readStashedAuthFlowId()
      const nextPath = searchParams.get('next') ?? '/dashboard'

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return

        if (error) {
          setMessage('El enlace no es válido o ha expirado.')
          if (flowId && window.opener) {
            completeAuthPopup(flowId, {
              status: 'error',
              error: error.message,
            })
          }
          return
        }
      }

      const user = await getLocalUser()
      if (cancelled) return

      if (user?.email_confirmed_at) {
        if (flowId && window.opener) {
          completeAuthPopup(flowId, { status: 'success', next: nextPath })
          return
        }
        router.replace(nextPath)
        return
      }

      setMessage('Tu correo aún no está confirmado.')
      router.replace(
        `/confirm-email?email=${encodeURIComponent(user?.email ?? '')}&send=1`,
      )
    }

    handleCallback()

    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <div className="auth-loading">
      <p>{message}</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <p>Cargando…</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
