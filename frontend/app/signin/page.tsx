'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignInForm } from '@/components/auth/SignInForm'
import { getLocalUser } from '@/lib/auth-session'
import {
  completeAuthPopup,
  createAuthFlowId,
  buildMobileSignInUrl,
  isAuthPopupMode,
  isMobileDevice,
  openAuthSignInPopup,
  parseFlowId,
  stashAuthFlowId,
} from '@/lib/auth-popup'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState(false)

  const search = typeof window !== 'undefined' ? window.location.search : ''
  const popupMode = isAuthPopupMode(search)
  const mobileMode = searchParams.get('mobile') === '1'
  const flowId = parseFlowId(search)
  const nextPath = searchParams.get('next')

  useEffect(() => {
    async function init() {
      const user = await getLocalUser()

      if (user?.email_confirmed_at) {
        if (popupMode && flowId) {
          completeAuthPopup(flowId, {
            status: 'success',
            next: nextPath ?? '/dashboard',
          })
          return
        }
        router.replace(nextPath ?? '/dashboard')
        return
      }

      if (!popupMode) {
        const resolvedFlowId = flowId ?? createAuthFlowId()
        stashAuthFlowId(resolvedFlowId)

        if (isMobileDevice()) {
          router.replace(
            buildMobileSignInUrl(resolvedFlowId, nextPath ?? undefined),
          )
          return
        }

        const popup = openAuthSignInPopup(resolvedFlowId, {
          next: nextPath ?? undefined,
        })

        if (!popup) {
          router.replace(
            `/login${flowId ? `?flowId=${encodeURIComponent(resolvedFlowId)}` : ''}`,
          )
          return
        }

        setLaunching(true)
        setLoading(false)
        return
      }

      if (flowId) {
        stashAuthFlowId(flowId)
      }

      setLoading(false)
    }

    init()
  }, [flowId, nextPath, popupMode, router])

  if (loading && popupMode) {
    return (
      <div className="auth-loading">
        <p>Cargando…</p>
      </div>
    )
  }

  if (!popupMode) {
    return (
      <div className="signin-launcher">
        <div className="signin-launcher-card">
          <p className="signup-eyebrow">NexoLearn</p>
          <h1>{launching ? 'Abriendo ventana de acceso…' : 'Preparando acceso…'}</h1>
          <p className="auth-subcopy">
            Si no aparece la ventana secundaria, permite ventanas emergentes para
            este sitio o continúa en la página principal.
          </p>
          <button
            type="button"
            className="signup-btn"
            onClick={() => router.replace('/login')}
          >
            Ir a inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        mobileMode ? 'signin-mobile-wrapper' : 'signin-popup-wrapper'
      }
    >
      <div
        className={
          mobileMode ? 'signin-mobile-panel login-panel' : 'signin-popup-panel'
        }
      >
        <p className="signup-eyebrow">NexoLearn</p>
        <SignInForm
          popupMode
          flowId={flowId}
          nextPath={nextPath}
          compact
        />
        <button
          type="button"
          className="auth-btn-ghost signin-popup-cancel"
          onClick={() => {
            if (flowId) {
              completeAuthPopup(flowId, { status: 'cancelled' })
            } else {
              window.close()
            }
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <p>Cargando…</p>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
