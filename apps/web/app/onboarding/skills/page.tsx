'use client'

import React from 'react'
import Link from 'next/link'

export default function SkillsPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Manage Skills</h1>
        <p className="text-gray-600 mb-6">This feature will be available in Sprint 2.</p>
        <Link href="/dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
