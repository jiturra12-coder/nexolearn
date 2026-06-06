import { supabase } from '@/lib/supabase'
import type {
  LearnGoalItem,
  SkillCatalogItem,
  TeachSkillItem,
} from '@/lib/skills-types'

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Debes iniciar sesión.')
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(json.error ?? 'Ocurrió un error. Inténtalo nuevamente.')
  }

  return json as T
}

export async function fetchSkillCatalog(
  query?: string,
): Promise<SkillCatalogItem[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : ''
  const { data } = await apiFetch<{ data: SkillCatalogItem[] }>(
    `/api/skills${params}`,
  )
  return data
}

export async function fetchTeachSkills(): Promise<TeachSkillItem[]> {
  const { data } = await apiFetch<{ data: TeachSkillItem[] }>(
    '/api/skills/teach',
  )
  return data
}

export async function addTeachSkill(payload: {
  skill_id?: string
  skill_name?: string
  level: string
}): Promise<TeachSkillItem> {
  const { data } = await apiFetch<{ data: TeachSkillItem }>(
    '/api/skills/teach',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
  return data
}

export async function removeTeachSkill(id: string): Promise<void> {
  await apiFetch(`/api/skills/teach/${id}`, { method: 'DELETE' })
}

export async function fetchLearnGoals(): Promise<LearnGoalItem[]> {
  const { data } = await apiFetch<{ data: LearnGoalItem[] }>('/api/goals')
  return data
}

export async function addLearnGoal(payload: {
  skill_id?: string
  skill_name?: string
  level: string
}): Promise<LearnGoalItem> {
  const { data } = await apiFetch<{ data: LearnGoalItem }>('/api/goals/learn', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function removeLearnGoal(id: string): Promise<void> {
  await apiFetch(`/api/goals/learn/${id}`, { method: 'DELETE' })
}
