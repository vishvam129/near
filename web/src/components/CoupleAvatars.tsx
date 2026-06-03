import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

const FACES = ['🙂', '😀', '😎', '🥰', '😇', '🤓', '😏', '🤠', '🐱', '🐶', '🦊', '🐰', '🐻', '🐼']
const COLORS = ['#ff5d8f', '#ff8a3d', '#ffd23f', '#4ad991', '#3db6ff', '#a86bff', '#9aa0a6']

export function CoupleAvatars() {
  const { user } = useAuth()
  const { couple, partner, profile, paired, setAvatar } = useCouple()
  const [editing, setEditing] = useState(false)

  if (!paired) return null

  const mine = (user && couple?.avatars?.[user.uid]) || { face: '🙂', color: '#ff5d8f' }
  const theirs = partner && couple?.avatars?.[partner.uid]

  return (
    <div className="card avatar-card">
      <h3 className="card-h muted-h">Us</h3>

      <div className="avatar-scene">
        <div className="avatar-figure">
          <div className="avatar-face" style={{ background: mine.color }}>
            {mine.face}
          </div>
          <span className="avatar-name">{profile?.name || 'You'}</span>
        </div>
        <span className="avatar-heart">💞</span>
        <div className="avatar-figure">
          {theirs ? (
            <>
              <div className="avatar-face" style={{ background: theirs.color }}>
                {theirs.face}
              </div>
              <span className="avatar-name">{partner?.name || 'Partner'}</span>
            </>
          ) : (
            <>
              <div className="avatar-face avatar-empty">？</div>
              <span className="avatar-name">{partner?.name || 'Partner'}</span>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="avatar-editor">
          <div className="avatar-faces">
            {FACES.map((f) => (
              <button
                key={f}
                type="button"
                className={`avatar-pick ${mine.face === f ? 'sel' : ''}`}
                onClick={() => void setAvatar(f, mine.color)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="avatar-colors">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`lamp-dot ${mine.color === c ? 'sel' : ''}`}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
                onClick={() => void setAvatar(mine.face, c)}
              />
            ))}
          </div>
          <button type="button" className="btn" onClick={() => setEditing(false)}>
            Done
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
          Customise my avatar
        </button>
      )}
    </div>
  )
}
