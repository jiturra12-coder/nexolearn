import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { isAuthRateLimited } from '@/lib/auth-messages'

export async function getLocalUser(): Promise<User | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

type AuthResult = { error: { message: string } | null }

export async function withAuthRateLimitRetry<T extends AuthResult>(
  operation: () => Promise<T>,
  retryDelaysMs = [0, 2000, 5000],
): Promise<T> {
  let lastResult = await operation()

  for (let attempt = 1; attempt < retryDelaysMs.length; attempt += 1) {
    if (!lastResult.error || !isAuthRateLimited(lastResult.error.message)) {
      return lastResult
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt]))
    lastResult = await operation()
  }

  return lastResult
}
