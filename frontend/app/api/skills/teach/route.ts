import { NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/api-auth'
import {
  countUserTeachSkills,
  findOrCreateSkill,
  isTeachLevel,
  MAX_SKILLS,
} from '@/lib/api/skills-db'

const TEACH_SELECT = `
  id,
  user_id,
  skill_id,
  level,
  created_at,
  skill:skills ( id, name, category )
`

export async function GET(request: Request) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from('user_teach_skills')
    .select(TEACH_SELECT)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: 'No se pudieron cargar tus habilidades.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data })
}

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
  if (!level || !isTeachLevel(level)) {
    return NextResponse.json(
      { error: 'Selecciona un nivel válido: Básico, Intermedio o Avanzado.' },
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

  const count = await countUserTeachSkills(auth.supabase, auth.user.id)
  if (count >= MAX_SKILLS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_SKILLS} habilidades para enseñar.` },
      { status: 400 },
    )
  }

  const { data: duplicate } = await auth.supabase
    .from('user_teach_skills')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('skill_id', skillId)
    .maybeSingle()

  if (duplicate) {
    return NextResponse.json(
      { error: 'Ya agregaste esta habilidad.' },
      { status: 409 },
    )
  }

  const { data, error } = await auth.supabase
    .from('user_teach_skills')
    .insert({
      user_id: auth.user.id,
      skill_id: skillId,
      level,
    })
    .select(TEACH_SELECT)
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ya agregaste esta habilidad.' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'No se pudo agregar la habilidad.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data }, { status: 201 })
}
