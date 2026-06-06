export function isAuthRateLimited(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('rate limit') ||
    normalized.includes('over_request_rate_limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('for security purposes') ||
    normalized.includes('email rate limit') ||
    normalized.includes('demasiados intentos')
  )
}

export function isExistingAccountError(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('user already registered') ||
    normalized.includes('already registered') ||
    normalized.includes('already been registered')
  )
}

export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Credenciales inválidas. Verifica tu correo y contraseña.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirma tu correo electrónico antes de iniciar sesión.'
  }
  if (normalized.includes('user already registered')) {
    return 'Este correo ya está registrado. Inicia sesión o recupera tu contraseña.'
  }
  if (normalized.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }
  if (normalized.includes('unable to validate email address')) {
    return 'El formato del correo electrónico no es válido.'
  }
  if (
    normalized.includes('email address not authorized') ||
    normalized.includes('not authorized')
  ) {
    return 'Este correo no puede recibir mensajes con el SMTP por defecto de Supabase. Configura SMTP personalizado o Resend en el servidor.'
  }

  return message
}

export function getWebmailUrl(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''

  if (domain.includes('gmail') || domain.includes('googlemail')) {
    return 'https://mail.google.com'
  }
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    return 'https://outlook.live.com/mail'
  }
  if (domain.includes('yahoo')) {
    return 'https://mail.yahoo.com'
  }
  if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
    return 'https://www.icloud.com/mail'
  }
  if (domain.includes('proton')) {
    return 'https://mail.proton.me'
  }

  return `mailto:${email}`
}
