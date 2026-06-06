export function formatFirstName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

const BLOCKED_GREETING_NAMES = new Set([
  'admin',
  'user',
  'guest',
  'student',
  'teacher',
  'usuario',
  'invitado',
])

export function getGreetingLine(firstName?: string | null): string {
  const trimmed = firstName?.trim()
  if (!trimmed) return 'Bienvenido 👋'
  if (BLOCKED_GREETING_NAMES.has(trimmed.toLowerCase())) return 'Bienvenido 👋'
  return `Hola, ${formatFirstName(trimmed)}`
}
