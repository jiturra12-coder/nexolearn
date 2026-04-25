'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    const { data } = await supabase.auth.getUser()

    if (data.user) {
      window.location.href = '/dashboard'
    } else {
      setLoading(false)
    }
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      window.location.href = '/dashboard'
    }
  }

  // 🔥 evita pantalla pegada
  if (loading) {
    return <div style={{ padding: 40 }}>Cargando...</div>
  }

  return (
    <div className="login-wrapper">

      {/* LEFT BRAND */}
      <div className="login-brand">

        <Image
          src="/logo.png"
          alt="Nexolearn logo"
          width={140}
          height={140}
          className="logo-img"
          priority
        />

        <h1>Nexolearn</h1>
        <p>Conecta. Enseña. Aprende.</p>
        <span>Crea valor real.</span>

      </div>

      {/* LOGIN BOX */}
      <div className="login-panel">

        <h2>Iniciar sesión</h2>

        {/* EMAIL */}
        <div className="input-box">
          <span className="icon">✉️</span>
          <input
            type="email"
            placeholder="Ingresa tu correo electrónico"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* PASSWORD */}
        <div className="input-box">
          <span className="icon">🔒</span>
          <input
            type={show ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña"
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="eye" onClick={() => setShow(!show)}>
            👁
          </span>
        </div>

        <div className="login-options">
          <label>
            <input type="checkbox" /> Recordarme
          </label>
          <span className="link">¿Olvidaste tu contraseña?</span>
        </div>

        <button className="login-btn" onClick={signIn}>
          Iniciar sesión
        </button>

        <p className="signup">
          ¿Eres nuevo? <span>Crear cuenta</span>
        </p>

      </div>

    </div>
  )
}