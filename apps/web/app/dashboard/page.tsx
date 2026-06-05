'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { getOwnProfile, type Profile } from '@/lib/api/profiles'
import { useNotification } from '@/lib/context/notification-context'

export default function DashboardPage(): React.ReactElement {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, signOut, session } = useAuth()
  const { addNotification } = useNotification()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const loadProfile = async (): Promise<void> => {
      if (!session?.access_token) return

      setIsLoadingProfile(true)
      try {
        const data = await getOwnProfile(session.access_token)
        setProfile(data.profile)
      } catch (error) {
        console.error('Failed to load profile:', error)
        addNotification('error', 'Failed to load profile')
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [isLoading, isAuthenticated, router, session, addNotification])

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut()
      addNotification('success', 'Signed out successfully')
      router.push('/login')
    } catch (error) {
      addNotification('error', 'Failed to sign out')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold">NexoLearn</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Welcome to NexoLearn</h2>

          {isLoadingProfile ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Profile Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Profile</h3>
                  <div className="mt-5 border-t border-gray-200">
                    <dl className="divide-y divide-gray-200">
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {profile.firstName} {profile.lastName}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {profile.email}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Location</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {profile.location || 'Not set'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <Link href="/onboarding/profile-setup" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Edit Profile
                  </Link>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white overflow-hidden shadow rounded-lg col-span-2">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Links</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                      href="/onboarding/skills"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                    >
                      Manage Skills
                    </Link>
                    <Link
                      href="/onboarding/goals"
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
                    >
                      Set Learning Goals
                    </Link>
                    <Link
                      href="/matches"
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
                    >
                      Find Matches
                    </Link>
                    <Link
                      href="/sessions"
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-center"
                    >
                      My Sessions
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to load your profile. Please refresh the page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
