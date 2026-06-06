import { NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/api-auth'

const GOAL_SELECT = `
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
    .from('user_learning_goals')
    .select(GOAL_SELECT)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: 'No se pudieron cargar tus objetivos.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data })
}
