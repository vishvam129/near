import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { fileToAlbumImage } from '../lib/image'

type Photo = { id: string; url: string; caption: string; by: string }

// Shared photo grid used by the open scrapbook (#40) and the PIN-locked
// vault (#18). The only difference between them is the subcollection name.
export function AlbumGrid({ name, emptyText }: { name: string; emptyText: string }) {
  const { user } = useAuth()
  const { couple } = useCouple()
  const coupleId = couple?.id
  const fileRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  useEffect(() => {
    if (!db || !coupleId) return
    const q = query(collection(db, 'couples', coupleId, name), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) =>
      setPhotos(
        snap.docs.map((d) => ({
          id: d.id,
          url: d.data().url ?? '',
          caption: d.data().caption ?? '',
          by: d.data().by ?? '',
        })),
      ),
    )
  }, [coupleId, name])

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !db || !coupleId || !user) return
    setBusy(true)
    setErr(null)
    try {
      const url = await fileToAlbumImage(file)
      await addDoc(collection(db, 'couples', coupleId, name), {
        url,
        caption: '',
        by: user.uid,
        createdAt: serverTimestamp(),
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add that photo.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, name, id))
    setLightbox(null)
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      <button
        type="button"
        className="btn album-add"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        {busy ? 'Adding…' : '＋ Add photo'}
      </button>
      {err && <div className="err">{err}</div>}

      {photos.length === 0 ? (
        <p className="entry-empty">{emptyText}</p>
      ) : (
        <div className="album-grid">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              className="album-thumb"
              onClick={() => setLightbox(p)}
              style={{ backgroundImage: `url(${p.url})` }}
              aria-label="Open photo"
            />
          ))}
        </div>
      )}

      {lightbox && (
        <div className="album-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox.url} alt={lightbox.caption || 'Photo'} />
          <button
            type="button"
            className="btn btn-ghost album-del"
            onClick={(e) => {
              e.stopPropagation()
              void remove(lightbox.id)
            }}
          >
            Delete photo
          </button>
        </div>
      )}
    </>
  )
}
