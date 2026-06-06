import { NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  let query = auth.supabase
    .from('skills')
    .select('id, name, category')
    .order('name', { ascending: true })
    .limit(50)

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: 'No se pudo cargar el catálogo de habilidades.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data })
}
