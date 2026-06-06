'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    async function redirect() {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
    redirect()
  }, [router])

  return (
    <div className="auth-loading">
      <p>Cargando…</p>
    </div>
  )
}
