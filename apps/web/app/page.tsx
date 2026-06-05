'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

export default function HomePage(): React.ReactElement {
  const router = useRouter()
  const { session, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (session) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [session, isLoading, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">NexoLearn</h1>
        <p className="mt-2 text-gray-600">Reciprocal Knowledge Exchange Platform</p>
        <p className="mt-4 text-gray-500">Redirecting...</p>
      </div>
    </div>
  )
}
