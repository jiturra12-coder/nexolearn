export const AUTH_POPUP_MESSAGE_TYPE = 'nexolearn:auth-popup'

export type AuthPopupStatus = 'success' | 'error' | 'cancelled'

export type AuthPopupMessage = {
  type: typeof AUTH_POPUP_MESSAGE_TYPE
  flowId: string
  status: AuthPopupStatus
  next?: string
  error?: string
}

const POPUP_FEATURES =
  'width=480,height=720,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes'

export function createAuthFlowId(): string {
  return crypto.randomUUID()
}

export function parseFlowId(search: string): string | null {
  const params = new URLSearchParams(search)
  const direct = params.get('flowId') ?? params.get('flowID')
  if (direct?.trim()) return direct.trim()

  if (search.startsWith('?/')) {
    const raw = search.slice(2).split('&')[0]?.trim()
    return raw || null
  }

  return null
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(max-width: 768px)').matches ||
    /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )
  )
}

export function isAuthPopupMode(search: string): boolean {
  const params = new URLSearchParams(search)
  const inline =
    params.get('popup') === '1' || params.get('mobile') === '1'
  return inline && Boolean(parseFlowId(search))
}

export function buildSignInPopupUrl(flowId: string, next?: string): string {
  const params = new URLSearchParams({
    flowId,
    popup: '1',
  })
  if (next) params.set('next', next)
  return `/signin?${params.toString()}`
}

export function buildMobileSignInUrl(flowId: string, next?: string): string {
  const params = new URLSearchParams({
    flowId,
    mobile: '1',
  })
  if (next) params.set('next', next)
  return `/signin?${params.toString()}`
}

export function getAuthCallbackRedirectUrl(flowId?: string | null): string | undefined {
  if (typeof window === 'undefined') return undefined

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const origin = configured || window.location.origin
  const params = new URLSearchParams()
  if (flowId) params.set('flowId', flowId)
  const query = params.toString()
  return `${origin}/auth/callback${query ? `?${query}` : ''}`
}

export function openAuthSignInPopup(
  flowId: string,
  options?: { next?: string },
): Window | null {
  stashAuthFlowId(flowId)

  if (isMobileDevice()) {
    window.location.assign(buildMobileSignInUrl(flowId, options?.next))
    return null
  }

  const url = `${window.location.origin}${buildSignInPopupUrl(flowId, options?.next)}`
  return window.open(url, `nexolearn-auth-${flowId}`, POPUP_FEATURES)
}

export function completeAuthPopup(
  flowId: string,
  result: {
    status: AuthPopupStatus
    next?: string
    error?: string
  },
) {
  const message: AuthPopupMessage = {
    type: AUTH_POPUP_MESSAGE_TYPE,
    flowId,
    ...result,
  }

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(message, window.location.origin)
  }

  if (!window.opener) {
    if (result.status === 'success') {
      window.location.replace(result.next ?? '/dashboard')
    } else {
      window.location.replace('/login')
    }
    return
  }

  window.close()
}

export function listenForAuthPopupResult(
  flowId: string,
  handler: (message: AuthPopupMessage) => void,
): () => void {
  function onMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return

    const data = event.data as AuthPopupMessage
    if (data?.type !== AUTH_POPUP_MESSAGE_TYPE || data.flowId !== flowId) return

    handler(data)
  }

  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}

export function stashAuthFlowId(flowId: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('nexolearn_auth_flow_id', flowId)
}

export function readStashedAuthFlowId(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('nexolearn_auth_flow_id')
}

export function clearStashedAuthFlowId() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('nexolearn_auth_flow_id')
}
