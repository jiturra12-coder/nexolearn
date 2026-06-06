export const TEACH_LEVELS = ['basico', 'intermedio', 'avanzado'] as const
export const LEARN_LEVELS = ['principiante', 'intermedio', 'avanzado'] as const

export type TeachLevel = (typeof TEACH_LEVELS)[number]
export type LearnLevel = (typeof LEARN_LEVELS)[number]

export const TEACH_LEVEL_LABELS: Record<TeachLevel, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export const LEARN_LEVEL_LABELS: Record<LearnLevel, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export const MAX_SKILLS = 5
export const MIN_SKILLS = 1

export interface SkillCatalogItem {
  id: string
  name: string
  category: string | null
}

export interface TeachSkillItem {
  id: string
  user_id: string
  skill_id: string
  level: TeachLevel
  created_at: string
  skill: SkillCatalogItem
}

export interface LearnGoalItem {
  id: string
  user_id: string
  skill_id: string
  level: LearnLevel
  created_at: string
  skill: SkillCatalogItem
}

export function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function formatSkillDisplayName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}
