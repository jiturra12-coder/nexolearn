'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      router.replace('/login')
    } else {
      setUser(data.user)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (!user) {
    return <div style={{ padding: 40 }}>Cargando...</div>
  }

  return (
    <div className="container">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>Nexolearn</h2>

        <div className="profile">
          <p>{user.email}</p>
        </div>

        <button>Inicio</button>
        <button>Sesiones</button>
        <button>Mensajes</button>
        <button>Red</button>

        {/* 🔥 LOGOUT */}
        <button
          onClick={signOut}
          style={{
            marginTop: 20,
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* MAIN */}
      <div className="main">
        <h1>Tu Dashboard</h1>
        <p>Bienvenido a Nexolearn 🚀</p>
      </div>

      {/* RIGHT */}
      <div className="right">
        <div className="card">
          <p>10 Nexos</p>
        </div>
      </div>

    </div>
  )
}