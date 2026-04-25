'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Onboarding() {

  const [teach, setTeach] = useState<string[]>([])
  const [learn, setLearn] = useState<string[]>([])
  const [inputTeach, setInputTeach] = useState('')
  const [inputLearn, setInputLearn] = useState('')
  const router = useRouter()

  // 🔒 protección: si no está logueado → login
  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      router.push('/')
    }
  }

  // ➕ agregar habilidad
  function addTeach() {
    if (inputTeach && teach.length < 5) {
      setTeach([...teach, inputTeach])
      setInputTeach('')
    }
  }

  function addLearn() {
    if (inputLearn && learn.length < 5) {
      setLearn([...learn, inputLearn])
      setInputLearn('')
    }
  }

  // 💾 guardar perfil
  async function saveProfile() {

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      alert('No user')
      return
    }

    if (teach.length === 0 || learn.length === 0) {
      alert('Agrega al menos una habilidad en cada sección')
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userData.user.id,
      email: userData.user.email,
      skills: teach,
      interests: learn
    })

    if (error) {
      console.log(error)
      alert('Error guardando perfil')
      return
    }

    // 🚀 REDIRECT REAL
    router.push('/dashboard')
  }

  return (
    <div className="onboarding">

      <h1>Configura tu perfil</h1>

      {/* ENSEÑAR */}
      <div className="section">
        <h3>¿Qué puedes enseñar?</h3>

        <div className="input-group">
          <input
            value={inputTeach}
            onChange={(e) => setInputTeach(e.target.value)}
            placeholder="Ej: Guitarra"
          />
          <button onClick={addTeach}>Agregar</button>
        </div>

        <div className="chips">
          {teach.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* APRENDER */}
      <div className="section">
        <h3>¿Qué quieres aprender?</h3>

        <div className="input-group">
          <input
            value={inputLearn}
            onChange={(e) => setInputLearn(e.target.value)}
            placeholder="Ej: Inglés"
          />
          <button onClick={addLearn}>Agregar</button>
        </div>

        <div className="chips">
          {learn.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      </div>

      {/* BOTÓN */}
      <button className="primary" onClick={saveProfile}>
        Guardar y continuar
      </button>

    </div>
  )
}