import { useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { fileToAlbumImage } from '../lib/image'

// Push a single photo to the partner's Home (#20). They see it big until they
// tap "Got it"; the sender sees a "pushed — waiting" state with a take-down.
export function PhotoWidget() {
  const { user } = useAuth()
  const { couple, partner, paired, setPhotoWidget } = useCouple()
  const fileRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!paired) return null

  const photo = couple?.photoWidget ?? null
  const fromMe = photo?.from === user?.uid

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      const url = await fileToAlbumImage(file)
      await setPhotoWidget({ url, caption: caption.trim().slice(0, 120) })
      setCaption('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send that photo.')
    } finally {
      setBusy(false)
    }
  }

  // A photo from the partner — show it big with a dismiss.
  if (photo && !fromMe) {
    return (
      <div className="card photo-widget photo-widget-got">
        <div className="note-pin-from">📸 {partner?.name || 'Your partner'} sent you a photo</div>
        <img className="photo-widget-img" src={photo.url} alt={photo.caption || 'Photo'} />
        {photo.caption && <div className="photo-widget-cap">{photo.caption}</div>}
        <button type="button" className="btn" onClick={() => void setPhotoWidget(null)}>
          Got it 💛
        </button>
      </div>
    )
  }

  // My own photo still on their screen.
  if (photo && fromMe) {
    return (
      <div className="card photo-widget">
        <h3 className="card-h muted-h">Photo on their Home</h3>
        <img className="photo-widget-img" src={photo.url} alt={photo.caption || 'Photo'} />
        {photo.caption && <div className="photo-widget-cap">{photo.caption}</div>}
        <div className="note-pin-status">📌 Showing on {partner?.name || 'their'} Home</div>
        <button type="button" className="link" onClick={() => void setPhotoWidget(null)}>
          Take it down
        </button>
      </div>
    )
  }

  // Compose.
  return (
    <div className="card photo-widget">
      <h3 className="card-h muted-h">Send a photo to their Home</h3>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      <input
        className="input"
        type="text"
        maxLength={120}
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? 'Sending…' : '📷 Choose a photo'}
      </button>
      {err && <div className="err">{err}</div>}
    </div>
  )
}
