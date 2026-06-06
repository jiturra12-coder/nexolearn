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

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes('bucket')) {
      return {
        error:
          'El almacenamiento de fotos no está configurado. Contacta al administrador.',
      }
    }
    return { error: 'No se pudo subir la foto. Inténtalo nuevamente.' }
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  const url = `${data.publicUrl}?t=${Date.now()}`

  return { url }
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

  const row: Record<string, string | null> = {
    id: payload.userId,
    email: payload.email,
    full_name: fullName,
    first_name: getFirstName(fullName),
  }

  if (payload.avatarUrl !== undefined) {
    row.avatar_url = payload.avatarUrl
  }

  const { error } = await supabase.from('profiles').upsert(row)

  if (error) {
    const withoutFirst = { ...row }
    delete withoutFirst.first_name
    const { error: retryError } = await supabase
      .from('profiles')
      .upsert(withoutFirst)

    if (retryError) {
      return { error: 'No se pudo guardar tu perfil. Inténtalo nuevamente.' }
    }
  }

  return { ok: true }
}
