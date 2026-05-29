import { initials } from '../lib/format'

type Props = {
  name?: string | null
  email?: string | null
  photoURL?: string | null
  size?: number
}

export function Avatar({ name, email, photoURL, size = 44 }: Props) {
  const style = { width: size, height: size, fontSize: size * 0.4 }
  if (photoURL) {
    return (
      <img
        className="avatar-img"
        style={{ width: size, height: size }}
        src={photoURL}
        alt={name ?? 'avatar'}
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div className="avatar-fallback" style={style}>
      {initials(name ?? null, email ?? null)}
    </div>
  )
}
