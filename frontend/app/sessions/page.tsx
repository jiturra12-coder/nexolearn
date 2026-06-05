'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SessionsPage() {
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
          <h1>Sesiones</h1>
          <p className="dash-empty">
            No tienes sesiones programadas. Primero necesitas una conexión;
            después podrás agendar tu primer intercambio.
          </p>
          <Link href="/matches" className="dash-cta-primary">
            Ver conexiones
          </Link>
          <Link href="/dashboard" className="dash-cta-secondary">
            Volver al panel
          </Link>
        </section>
      </main>
    </div>
  )
}
