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

// Resize an image File to a chat-friendly JPEG data URL (max ~1280px on the
// long edge), kept under Firestore's ~1MB per-document limit by lowering quality
// if needed. No storage service required for the MVP; Moments uses a real host.
export async function fileToMessageImage(file: File, maxDim = 1280): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  const img = await loadImage(file)
  const w = (img as { width: number }).width
  const h = (img as { height: number }).height
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image on this device.')
  ctx.drawImage(img, 0, 0, cw, ch)
  if (img instanceof ImageBitmap) img.close()

  for (const q of [0.75, 0.6, 0.45, 0.3]) {
    const url = canvas.toDataURL('image/jpeg', q)
    if (url.length < 900_000) return url
  }
  throw new Error('That image is too large — please try a smaller one.')
}

// Resize a photo for an album/scrapbook entry. Albums hold many photos, so we
// aim a bit smaller than chat (max ~1000px, target well under Firestore's 1MB
// per-doc limit) — each photo is one document, no storage service required.
export async function fileToAlbumImage(file: File, maxDim = 1000): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  const img = await loadImage(file)
  const w = (img as { width: number }).width
  const h = (img as { height: number }).height
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image on this device.')
  ctx.drawImage(img, 0, 0, cw, ch)
  if (img instanceof ImageBitmap) img.close()

  for (const q of [0.7, 0.55, 0.4, 0.3]) {
    const url = canvas.toDataURL('image/jpeg', q)
    if (url.length < 700_000) return url
  }
  throw new Error('That image is too large — please try a smaller one.')
}

// Resize a photo destined for a FIELD on the couples doc (the Home photo
// widget), not its own document. That doc already holds lots of state, so we
// target a much smaller payload (<300KB) to stay clear of the 1MB doc limit.
export async function fileToWidgetImage(file: File, maxDim = 720): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  const img = await loadImage(file)
  const w = (img as { width: number }).width
  const h = (img as { height: number }).height
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image on this device.')
  ctx.drawImage(img, 0, 0, cw, ch)
  if (img instanceof ImageBitmap) img.close()

  for (const q of [0.65, 0.5, 0.38, 0.28]) {
    const url = canvas.toDataURL('image/jpeg', q)
    if (url.length < 300_000) return url
  }
  throw new Error('That image is too large — please try a smaller one.')
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
