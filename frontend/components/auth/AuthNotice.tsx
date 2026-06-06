export type AuthNoticeVariant = 'success' | 'error' | 'info'

interface AuthNoticeProps {
  variant: AuthNoticeVariant
  message: string
}

export function AuthNotice({ variant, message }: AuthNoticeProps) {
  if (!message) return null

  return (
    <p
      className={`auth-notice auth-notice--${variant}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {message}
    </p>
  )
}
