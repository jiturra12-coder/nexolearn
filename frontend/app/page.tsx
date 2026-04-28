'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      router.replace('/dashboard')
    } else {
      setLoading(false)
    }
  }

  async function signIn() {
    console.log('LOGIN CLICK 🚀', email)

    if (!email || !password) {
      alert('Completa email y contraseña')
      return
    }

    setBusy(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setBusy(false)

    if (error) {
      alert(error.message)
    } else {
      router.replace('/dashboard')
    }
  }

  async function signUp() {
    console.log('SIGNUP CLICK 🚀', email)

    if (!email || !password) {
      alert('Completa email y contraseña')
      return
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setBusy(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    console.log('SIGNUP RESULT:', data, error)

    setBusy(false)

    if (error) {
      alert(error.message)
      return
    }

    // 🔥 flujo directo sin email confirmation
    alert('Cuenta creada 🚀')
    router.replace('/onboarding')
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Cargando...</div>
  }

  return (
    <div className="login-wrapper">
      {/* LEFT */}
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

      {/* RIGHT */}
      <div className="login-panel">
        <h2>Iniciar sesión</h2>

        {/* EMAIL */}
        <div className="input-box">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* PASSWORD */}
        <div className="input-box">
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* LOGIN */}
        <button
          className="login-btn"
          onClick={signIn}
          disabled={busy}
        >
          {busy ? 'Procesando...' : 'Iniciar sesión'}
        </button>

        {/* SIGNUP */}
        <p className="signup">¿Eres nuevo?</p>

        <button
          onClick={signUp}
          className="login-btn"
          style={{ marginTop: 10 }}
          disabled={busy}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  )
}