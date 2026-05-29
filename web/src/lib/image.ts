// Reads an image File and returns a small square JPEG data URL suitable for an
// avatar. Resizing client-side keeps the stored value tiny (~20-60 KB), so it
// fits comfortably in a Firestore field with no storage service required.
// Larger photo features (the Moments album) will use a real image host later.
export async function fileToAvatarDataUrl(
  file: File,
  size = 256,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image on this device.')

  // Center-crop to a square ("cover").
  const w = (img as { width: number }).width
  const h = (img as { height: number }).height
  const scale = Math.max(size / w, size / h)
  const dw = w * scale
  const dh = h * scale
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)

  if (img instanceof ImageBitmap) img.close()
  return canvas.toDataURL('image/jpeg', quality)
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fall back to <img> below */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    img.src = url
  })
}
