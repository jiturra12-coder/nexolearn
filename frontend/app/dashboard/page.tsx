'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {

  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {

    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      router.push('/')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      router.push('/onboarding')
      return
    }

    setProfile(profile)
  }

  if (!profile) {
    return <div style={{ padding: 40 }}>Cargando dashboard...</div>
  }

  return (
    <div className="container">

      <aside className="sidebar">
        <h2>NexoLearn</h2>

        <div className="profile">
          <div className="avatar" />
          <p>{profile.email}</p>
          <span>Usuario</span>
        </div>

        <nav>
          <button>Inicio</button>
          <button>Sesiones</button>
          <button>Mensajes</button>
          <button>Red</button>
        </nav>
      </aside>

      <main className="main">
        <h1>Tu Dashboard</h1>

        <div className="card main-card">
          <p><b>Enseñas:</b> {profile.skills?.join(', ')}</p>
          <p><b>Aprendes:</b> {profile.interests?.join(', ')}</p>
        </div>

        <div className="card">
          <p>Buscando conexión perfecta...</p>
        </div>
      </main>

      <aside className="right">
        <div className="card">
          <p>10 Nexos</p>
        </div>
      </aside>

    </div>
  )
}