'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard?setup=profile')
  }, [router])

  return (
    <div className="auth-loading">
      <p>Redirigiendo al dashboard…</p>
    </div>
  )
}
