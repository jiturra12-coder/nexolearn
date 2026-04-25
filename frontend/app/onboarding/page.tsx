'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Onboarding() {

  const [teach, setTeach] = useState<string[]>([])
  const [learn, setLearn] = useState<string[]>([])
  const [inputTeach, setInputTeach] = useState('')
  const [inputLearn, setInputLearn] = useState('')

  function addSkill(type: 'teach' | 'learn') {
    if (type === 'teach' && inputTeach) {
      setTeach([...teach, inputTeach])
      setInputTeach('')
    }
    if (type === 'learn' && inputLearn) {
      setLearn([...learn, inputLearn])
      setInputLearn('')
    }
  }

  async function saveProfile() {
    const { data } = await supabase.auth.getUser()

    await supabase.from('profiles').upsert({
  id: data.user?.id,
  email: data.user?.email,
  skills: teach,
  interests: learn
})

    window.location.href = '/dashboard'
  }

  return (
    <div className="onboarding">

      <h1>Escribe todo lo que se te ocurra</h1>

      {/* TEACH */}
      <div className="section">
        <h2>¿Qué puedes enseñar?</h2>

        <div className="input-group">
          <input
            value={inputTeach}
            onChange={(e) => setInputTeach(e.target.value)}
            placeholder="Ej: Inglés"
          />
          <button onClick={() => addSkill('teach')}>+</button>
        </div>

        <div className="chips">
          {teach.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
      </div>

      {/* LEARN */}
      <div className="section">
        <h2>¿Qué quieres aprender?</h2>

        <div className="input-group">
          <input
            value={inputLearn}
            onChange={(e) => setInputLearn(e.target.value)}
            placeholder="Ej: Programación"
          />
          <button onClick={() => addSkill('learn')}>+</button>
        </div>

        <div className="chips">
          {learn.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
      </div>

      <button className="primary" onClick={saveProfile}>
        Entrar a NexoLearn
      </button>

    </div>
  )
}