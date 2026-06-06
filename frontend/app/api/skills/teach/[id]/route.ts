import { NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/api-auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth.error) return auth.error

  const { id } = await params

  const { data: existing } = await auth.supabase
    .from('user_teach_skills')
    .select('id')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { error: 'Habilidad no encontrada.' },
      { status: 404 },
    )
  }

  const { error } = await auth.supabase
    .from('user_teach_skills')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)

  if (error) {
    return NextResponse.json(
      { error: 'No se pudo eliminar la habilidad.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
