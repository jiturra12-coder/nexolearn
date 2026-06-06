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
  if (normalized.includes('rate limit')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
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
