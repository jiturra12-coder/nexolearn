'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLocalUser } from '@/lib/auth-session'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    async function redirect() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace('/dashboard?setup=profile')
          return
        }
      }

      const user = await getLocalUser()
      if (user?.email_confirmed_at) {
        router.replace('/dashboard')
      } else if (user) {
        const email = encodeURIComponent(user.email ?? '')
        router.replace(`/dashboard?verify=1&email=${email}`)
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
