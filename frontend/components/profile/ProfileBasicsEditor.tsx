'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { fetchUserProfile, saveProfileBasics, uploadAvatar } from '@/lib/profile'
import { supabase } from '@/lib/supabase'

export interface ProfileBasicsEditorHandle {
  save: () => Promise<boolean>
}

interface ProfileBasicsEditorProps {
  showSaveButton?: boolean
}

export const ProfileBasicsEditor = forwardRef<
  ProfileBasicsEditorHandle,
  ProfileBasicsEditorProps
>(function ProfileBasicsEditor({ showSaveButton = false }, ref) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      setLoading(false)
      return
    }

    setUserId(authData.user.id)
    setEmail(authData.user.email ?? '')

    const profileData = await fetchUserProfile(authData.user.id)

    if (profileData) {
      setFullName(
        profileData.full_name?.trim() || profileData.first_name?.trim() || '',
      )
      setAvatarUrl(profileData.avatar_url ?? null)
      setPreviewUrl(profileData.avatar_url ?? null)
    }

    setLoading(false)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError('')
    setSuccess('')
    const file = e.target.files?.[0]
    if (!file) return

    setPendingFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  async function persistProfile(): Promise<boolean> {
    setError('')
    setSuccess('')

    if (!userId) {
      setError('Debes iniciar sesión.')
      return false
    }

    setBusy(true)

    let nextAvatarUrl = avatarUrl

    if (pendingFile) {
      const upload = await uploadAvatar(userId, pendingFile)
      if ('error' in upload) {
        setBusy(false)
        setError(upload.error)
        return false
      }
      nextAvatarUrl = upload.url
      setAvatarUrl(upload.url)
      setPendingFile(null)
    }

    const result = await saveProfileBasics({
      userId,
      email,
      fullName,
      ...(nextAvatarUrl ? { avatarUrl: nextAvatarUrl } : {}),
    })

    setBusy(false)

    if ('error' in result) {
      setError(result.error)
      return false
    }

    setSuccess('Perfil actualizado correctamente.')
    window.dispatchEvent(new Event('nexolearn:profile-updated'))
    return true
  }

  useImperativeHandle(ref, () => ({
    save: persistProfile,
  }))

  if (loading) {
    return (
      <div className="profile-basics-loading">
        <p>Cargando perfil…</p>
      </div>
    )
  }

  return (
    <section className="profile-basics">
      <h3>Tu perfil</h3>
      <p className="profile-basics-desc">
        Tu nombre y foto ayudan a generar confianza en la comunidad.
      </p>

      <div className="profile-avatar-row">
        <div className="profile-avatar-preview" aria-hidden="true">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="profile-avatar-img" />
          ) : (
            <span className="profile-avatar-placeholder">
              {fullName.trim().charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>

        <div className="profile-avatar-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="profile-avatar-input"
            onChange={handleFileChange}
            aria-label="Seleccionar foto de perfil"
          />
          <button
            type="button"
            className="profile-avatar-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            {previewUrl ? 'Cambiar foto' : 'Subir foto'}
          </button>
          <p className="profile-avatar-hint">JPG, PNG o WebP · máx. 2 MB</p>
        </div>
      </div>

      <label className="field-label" htmlFor="profile-full-name">
        Nombre
      </label>
      <div className="input-box profile-name-input">
        <input
          id="profile-full-name"
          type="text"
          placeholder="Tu nombre"
          autoComplete="name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value)
            setError('')
            setSuccess('')
          }}
          disabled={busy}
        />
      </div>

      <AuthNotice variant="error" message={error} />
      <AuthNotice variant="success" message={success} />

      {showSaveButton ? (
        <button
          type="button"
          className="profile-save-btn"
          onClick={persistProfile}
          disabled={busy}
        >
          {busy ? 'Guardando…' : 'Guardar perfil'}
        </button>
      ) : null}
    </section>
  )
})
