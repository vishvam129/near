// Free media hosting for video messages (#17) via Cloudinary unsigned upload.
// Uses an *unsigned* upload preset, so only the public cloud name + preset
// name live in the client (no secret). Set both in web/.env:
//   VITE_CLOUDINARY_CLOUD_NAME=...
//   VITE_CLOUDINARY_UPLOAD_PRESET=...
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined

export const cloudinaryEnabled = Boolean(CLOUD && PRESET)

export async function uploadVideo(blob: Blob): Promise<string> {
  if (!CLOUD || !PRESET) throw new Error('Video hosting isn’t configured.')
  const form = new FormData()
  form.append('file', blob)
  form.append('upload_preset', PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Upload failed — please try again.')
  const data = await res.json()
  if (!data.secure_url) throw new Error('Upload failed — no URL returned.')
  return data.secure_url as string
}
