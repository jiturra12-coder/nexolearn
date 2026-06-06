import type { SupabaseClient } from '@supabase/supabase-js'
import {
  formatSkillDisplayName,
  LEARN_LEVELS,
  MAX_SKILLS,
  normalizeSkillName,
  TEACH_LEVELS,
  type LearnLevel,
  type TeachLevel,
} from '@/lib/skills-types'

export async function findOrCreateSkill(
  supabase: SupabaseClient,
  rawName: string,
): Promise<{ id: string; name: string } | { error: string }> {
  const name = formatSkillDisplayName(rawName)
  const name_normalized = normalizeSkillName(name)

  if (!name_normalized) {
    return { error: 'El nombre de la habilidad no es válido.' }
  }

  const { data: existing } = await supabase
    .from('skills')
    .select('id, name')
    .eq('name_normalized', name_normalized)
    .maybeSingle()

  if (existing) {
    return { id: existing.id, name: existing.name }
  }

  const { data: created, error } = await supabase
    .from('skills')
    .insert({ name, name_normalized })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('skills')
        .select('id, name')
        .eq('name_normalized', name_normalized)
        .maybeSingle()
      if (retry) return { id: retry.id, name: retry.name }
    }
    return { error: 'No se pudo registrar la habilidad en el catálogo.' }
  }

  return { id: created.id, name: created.name }
}

export function isTeachLevel(value: string): value is TeachLevel {
  return (TEACH_LEVELS as readonly string[]).includes(value)
}

export function isLearnLevel(value: string): value is LearnLevel {
  return (LEARN_LEVELS as readonly string[]).includes(value)
}

export async function countUserTeachSkills(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from('user_teach_skills')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

export async function countUserLearnGoals(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from('user_learning_goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

export { MAX_SKILLS }
