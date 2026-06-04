import { useCouple } from '../couple/CoupleProvider'
import { AlbumGrid } from './AlbumGrid'

export function PhotoAlbum() {
  const { paired } = useCouple()
  if (!paired) return null
  return (
    <div className="card">
      <h3 className="card-h muted-h">Our scrapbook</h3>
      <AlbumGrid name="album" emptyText="No photos yet — add your first memory together." />
    </div>
  )
}
