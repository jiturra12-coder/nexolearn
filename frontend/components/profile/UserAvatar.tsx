interface UserAvatarProps {
  name?: string | null
  email?: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitial(name?: string | null, email?: string): string {
  const fromName = name?.trim().charAt(0)
  if (fromName) return fromName.toUpperCase()
  const fromEmail = email?.trim().charAt(0)
  if (fromEmail) return fromEmail.toUpperCase()
  return '?'
}

export function UserAvatar({
  name,
  email,
  imageUrl,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const initial = getInitial(name, email)

  return (
    <div
      className={`user-avatar user-avatar--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="user-avatar-img" />
      ) : (
        <span className="user-avatar-placeholder">{initial}</span>
      )}
    </div>
  )
}
