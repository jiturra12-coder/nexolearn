import { supabase } from '@/lib/supabase'

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ''
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

async function updateProfileRow(
  userId: string,
  payload: Record<string, string | null>,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)

  if (error) {
    return { error: translateProfileError(error.message, error.code) }
  }

  return { ok: true }
}

async function insertProfileRow(
  userId: string,
  email: string,
  payload: Record<string, string | null>,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    email,
    ...payload,
  })

  if (error) {
    return { error: translateProfileError(error.message, error.code) }
  }

  return { ok: true }
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

  const basePayload: Record<string, string | null> = {
    full_name: fullName,
  }

  if (payload.avatarUrl) {
    basePayload.avatar_url = payload.avatarUrl
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', payload.userId)
    .maybeSingle()

  if (existing) {
    let result = await updateProfileRow(payload.userId, basePayload)

    if ('error' in result && result.error.includes('columnas del perfil')) {
      const legacyPayload: Record<string, string | null> = {
        first_name: getFirstName(fullName),
      }
      if (payload.avatarUrl) legacyPayload.avatar_url = payload.avatarUrl
      result = await updateProfileRow(payload.userId, legacyPayload)
    }

    if ('error' in result) {
      console.error('profile update failed', result.error)
    }

    return result
  }

  if (!payload.email) {
    return { error: 'No encontramos tu correo electrónico.' }
  }

  let result = await insertProfileRow(payload.userId, payload.email, basePayload)

  if ('error' in result) {
    const withFirstName: Record<string, string | null> = {
      first_name: getFirstName(fullName),
    }
    if (payload.avatarUrl) withFirstName.avatar_url = payload.avatarUrl
    result = await insertProfileRow(payload.userId, payload.email, withFirstName)
  }

  if ('error' in result) {
    console.error('profile insert failed', result.error)
  }

  return result
}
