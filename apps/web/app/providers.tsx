'use client'

import React from 'react'
import { AuthProvider } from '@/lib/context/auth-context'
import { NotificationProvider } from '@/lib/context/notification-context'

export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  )
}
