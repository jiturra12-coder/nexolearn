export function getEmailConfirmationRedirectUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const origin = configured || window.location.origin
  return `${origin}/confirm-email`
}

export function getServerSiteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured) return configured

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (request) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    const proto = request.headers.get('x-forwarded-proto') ?? 'https'
    if (host) return `${proto}://${host}`
  }

  return 'http://localhost:3000'
}
