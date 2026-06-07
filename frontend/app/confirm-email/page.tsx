'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConfirmEmailRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const email = searchParams.get('email')
    const params = new URLSearchParams({ verify: '1' })
    if (email) params.set('email', email)
    router.replace(`/dashboard?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="auth-loading">
      <p>Redirigiendo…</p>
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
      <ConfirmEmailRedirect />
    </Suspense>
  )
}
