import { supabase } from '@/lib/supabase'

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const BLOCKED_GREETING_NAMES = new Set([
  'admin',
  'user',
  'guest',
  'student',
  'teacher',
  'usuario',
  'invitado',
])

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ''
}

export function getProfileDisplayName(profile: {
  full_name?: string | null
  first_name?: string | null
} | null): string | null {
  const full = profile?.full_name?.trim()
  if (full) return full

  const first = profile?.first_name?.trim()
  if (first && !BLOCKED_GREETING_NAMES.has(first.toLowerCase())) return first

  return null
}

export function hasProfileName(profile: {
  full_name?: string | null
  first_name?: string | null
} | null): boolean {
  return getProfileDisplayName(profile) !== null
}

export interface ProfileBasics {
  email?: string
  first_name?: string | null
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  created_at?: string
}

const PROFILE_SELECT_ATTEMPTS = [
  'first_name, full_name, avatar_url, email',
  'full_name, first_name, avatar_url',
  'first_name, avatar_url',
  'full_name, avatar_url',
  'avatar_url',
] as const

export async function fetchUserProfile(
  userId: string,
): Promise<ProfileBasics | null> {
  let merged: ProfileBasics = {}

  for (const fields of PROFILE_SELECT_ATTEMPTS) {
    const { data, error } = await supabase
      .from('profiles')
      .select(fields)
      .eq('id', userId)
      .maybeSingle()

    if (!error && data) {
      merged = { ...merged, ...(data as ProfileBasics) }
    }
  }

  if (Object.keys(merged).length === 0) return null

  return merged
}

function translateProfileError(message: string, code?: string): string {
  const lower = message.toLowerCase()

  if (code === '42501' || lower.includes('row-level security')) {
    return 'No tienes permiso para actualizar tu perfil. Inicia sesión de nuevo.'
  }
  if (code === '23505' || lower.includes('duplicate')) {
    return 'Conflicto al guardar el perfil. Inténtalo nuevamente.'
  }
  if (lower.includes('first_name') || lower.includes('full_name')) {
    return 'Falta configurar las columnas del perfil en la base de datos.'
  }

  return 'No se pudo guardar tu perfil. Inténtalo nuevamente.'
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: 'Formato no válido. Usa JPG, PNG o WebP.' }
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { error: 'La imagen debe pesar menos de 2 MB.' }
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: removeError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([path])

  if (removeError && !removeError.message.toLowerCase().includes('not found')) {
    console.error('avatar remove', removeError)
  }

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadError) {
    console.error('avatar upload', uploadError)
    if (uploadError.message.toLowerCase().includes('bucket')) {
      return {
        error:
          'El almacenamiento de fotos no está configurado. Ejecuta la migración de avatars en Supabase.',
      }
    }
    if (
      uploadError.message.toLowerCase().includes('policy') ||
      uploadError.message.toLowerCase().includes('security')
    ) {
      return {
        error:
          'No tienes permiso para subir la foto. Verifica las políticas del bucket avatars.',
      }
    }
    return { error: 'No se pudo subir la foto. Inténtalo nuevamente.' }
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  const url = `${data.publicUrl}?t=${Date.now()}`

  return { url }
}

function buildProfilePayloads(
  fullName: string,
  avatarUrl?: string | null,
): Record<string, string | null>[] {
  const firstName = getFirstName(fullName)
  const variants: Record<string, string | null>[] = [
    { full_name: fullName, first_name: firstName },
    { full_name: fullName },
    { first_name: firstName },
  ]

  if (!avatarUrl) return variants

  return variants.map((variant) => ({
    ...variant,
    avatar_url: avatarUrl,
  }))
}

function isColumnError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('column') ||
    lower.includes('schema cache') ||
    lower.includes('full_name') ||
    lower.includes('first_name')
  )
}

async function tryProfileWrites(
  userId: string,
  email: string,
  payloads: Record<string, string | null>[],
  existing: boolean,
): Promise<{ ok: true } | { error: string }> {
  let lastError = 'No se pudo guardar tu perfil. Inténtalo nuevamente.'

  for (const row of payloads) {
    if (existing) {
      const { error } = await supabase
        .from('profiles')
        .update(row)
        .eq('id', userId)

      if (!error) return { ok: true }

      lastError = translateProfileError(error.message, error.code)
      if (!isColumnError(error.message)) {
        console.error('profile update failed', error)
        return { error: lastError }
      }
    } else {
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        email,
        ...row,
      })

      if (!error) return { ok: true }

      lastError = translateProfileError(error.message, error.code)
      if (!isColumnError(error.message)) {
        console.error('profile insert failed', error)
        return { error: lastError }
      }
    }
  }

  return { error: lastError }
}

export async function saveProfileBasics(payload: {
  userId: string
  email: string
  fullName: string
  avatarUrl?: string | null
}): Promise<{ ok: true } | { error: string }> {
  const fullName = payload.fullName.trim()

  if (!fullName) {
    return { error: 'Ingresa tu nombre.' }
  }

  if (fullName.length < 2) {
    return { error: 'El nombre debe tener al menos 2 caracteres.' }
  }

  const payloads = buildProfilePayloads(fullName, payload.avatarUrl)

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', payload.userId)
    .maybeSingle()

  if (existing) {
    return tryProfileWrites(payload.userId, payload.email, payloads, true)
  }

  if (!payload.email) {
    return { error: 'No encontramos tu correo electrónico.' }
  }

  return tryProfileWrites(payload.userId, payload.email, payloads, false)
}
