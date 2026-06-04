// Client-side end-to-end encryption for the secret chat (#62).
//
// The couple agrees a passphrase out-of-band (in person, on a call). Each
// device derives an AES-GCM key from it with PBKDF2; the key never leaves the
// device and is never written to Firestore. Only ciphertext + IV are stored,
// so the server (and anyone with database access) sees nothing readable.

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const bytes = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// Derive a 256-bit AES-GCM key from the passphrase, salted with a stable,
// per-couple value (the couple id) so two couples with the same passphrase
// still get different keys.
export async function deriveKey(passphrase: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(enc.encode(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(enc.encode('near-secret:' + salt)),
      iterations: 150_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptText(text: string, key: CryptoKey): Promise<{ ct: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ctBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new Uint8Array(enc.encode(text)),
  )
  return { ct: bufToB64(ctBuf), iv: bufToB64(iv.buffer) }
}

// Returns null when the ciphertext can't be decrypted with this key (wrong
// passphrase or tampered data) — AES-GCM authentication fails closed.
export async function decryptText(ct: string, iv: string, key: CryptoKey): Promise<string | null> {
  try {
    const buf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(iv) },
      key,
      b64ToBytes(ct),
    )
    return new TextDecoder().decode(buf)
  } catch {
    return null
  }
}
