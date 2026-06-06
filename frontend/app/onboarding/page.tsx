'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ActivationProgress } from '@/components/auth/ActivationProgress'
import {
  ProfileBasicsEditor,
  type ProfileBasicsEditorHandle,
} from '@/components/profile/ProfileBasicsEditor'
import { SkillsGoalsEditor } from '@/components/skills/SkillsGoalsEditor'

export default function Onboarding() {
  const router = useRouter()
  const profileRef = useRef<ProfileBasicsEditorHandle>(null)

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

  async function handleComplete(): Promise<boolean> {
    const profileSaved = await profileRef.current?.save()
    if (!profileSaved) return false
    router.push('/dashboard')
    return true
  }

  return (
    <div className="onboarding skills-onboarding">
      <ActivationProgress currentStep={3} />

      <h1>Editar perfil</h1>
      <p className="skills-onboarding-lead">
        Actualiza tu nombre y foto, y define qué puedes enseñar y qué quieres
        aprender.
      </p>

      <ProfileBasicsEditor ref={profileRef} />

      <SkillsGoalsEditor
        onComplete={handleComplete}
        continueLabel="Guardar y continuar"
      />
    </div>
  )
}
