'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ActivationProgress } from '@/components/auth/ActivationProgress'
import { SkillsGoalsEditor } from '@/components/skills/SkillsGoalsEditor'

export default function Onboarding() {
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      router.push('/login')
      return
    }

    if (!data.user.email_confirmed_at) {
      router.push(
        `/confirm-email?email=${encodeURIComponent(data.user.email ?? '')}`,
      )
    }
  }

  return (
    <div className="onboarding skills-onboarding">
      <ActivationProgress currentStep={3} />

      <h1>Configura tu perfil</h1>
      <p className="skills-onboarding-lead">
        Define qué puedes enseñar y qué quieres aprender. Esto prepara tu perfil
        para el motor de conexiones.
      </p>

      <SkillsGoalsEditor
        onComplete={() => router.push('/dashboard')}
        continueLabel="Guardar y continuar"
      />
    </div>
  )
}
