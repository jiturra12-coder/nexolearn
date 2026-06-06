import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type AuthResult =
  | { supabase: SupabaseClient; user: User; error?: undefined }
  | { supabase?: undefined; user?: undefined; error: NextResponse }

export async function getAuthenticatedSupabase(
  request: Request,
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ error: 'No autorizado.' }, { status: 401 }),
    }
  }

  const token = authHeader.slice(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json({ error: 'No autorizado.' }, { status: 401 }),
    }
  }

  return { supabase, user }
}
