'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MatchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login')
      else setLoading(false)
    })
  }, [router])

  if (loading) {
    return <div className="dash-v2 dash-v2--loading"><p>Cargando...</p></div>
  }

  return (
    <div className="dash-v2 dash-subpage">
      <header className="dash-topbar">
        <Link href="/dashboard" className="dash-brand">
          NexoLearn
        </Link>
      </header>
      <main className="dash-main">
        <section className="card">
          <h1>Conexiones</h1>
          <p className="dash-empty">
            Aún no hay conexiones disponibles. Completa tu perfil y vuelve al
            panel para ver tu próximo paso recomendado.
          </p>
          <Link href="/dashboard" className="dash-cta-primary">
            Volver al panel
          </Link>
          <Link href="/dashboard?setup=profile" className="dash-cta-secondary">
            Editar perfil
          </Link>
        </section>
      </main>
    </div>
  )
}
