'use client'

import React from 'react'
import Link from 'next/link'

export default function OnboardingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Onboarding</h1>
        <p className="text-gray-600 mb-6">Complete these steps to get started on NexoLearn.</p>
        <div className="space-y-3">
          <Link
            href="/onboarding/profile-setup"
            className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
          >
            Profile Setup
          </Link>
          <Link
            href="/onboarding/skills"
            className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
          >
            Manage Skills
          </Link>
          <Link
            href="/onboarding/goals"
            className="block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
          >
            Set Learning Goals
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="mt-6 inline-block w-full text-center text-sm text-blue-600 hover:text-blue-500"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
