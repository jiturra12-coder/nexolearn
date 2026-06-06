import { NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/api-auth'
import {
  countUserLearnGoals,
  findOrCreateSkill,
  isLearnLevel,
  MAX_SKILLS,
} from '@/lib/api/skills-db'

const GOAL_SELECT = `
  id,
  user_id,
  skill_id,
  level,
  created_at,
  skill:skills ( id, name, category )
`

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth.error) return auth.error

  let body: { skill_id?: string; skill_name?: string; level?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const level = body.level?.trim()
  if (!level || !isLearnLevel(level)) {
    return NextResponse.json(
      {
        error:
          'Selecciona un nivel válido: Principiante, Intermedio o Avanzado.',
      },
      { status: 400 },
    )
  }

  let skillId = body.skill_id?.trim()

  if (!skillId && body.skill_name?.trim()) {
    const result = await findOrCreateSkill(auth.supabase, body.skill_name)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    skillId = result.id
  }

  if (!skillId) {
    return NextResponse.json(
      { error: 'Selecciona una habilidad del catálogo.' },
      { status: 400 },
    )
  }

  const count = await countUserLearnGoals(auth.supabase, auth.user.id)
  if (count >= MAX_SKILLS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_SKILLS} objetivos de aprendizaje.` },
      { status: 400 },
    )
  }

  const { data: duplicate } = await auth.supabase
    .from('user_learning_goals')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('skill_id', skillId)
    .maybeSingle()

  if (duplicate) {
    return NextResponse.json(
      { error: 'Ya agregaste este objetivo.' },
      { status: 409 },
    )
  }

  const { data, error } = await auth.supabase
    .from('user_learning_goals')
    .insert({
      user_id: auth.user.id,
      skill_id: skillId,
      level,
    })
    .select(GOAL_SELECT)
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ya agregaste este objetivo.' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'No se pudo agregar el objetivo.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data }, { status: 201 })
}
