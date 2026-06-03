// Device-local app lock (casual privacy — not server-enforced). Stores a hash
// of the PIN in localStorage so the raw PIN isn't kept.
const KEY = 'near_pin'

function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return String(h)
}

export function hasPin(): boolean {
  return Boolean(localStorage.getItem(KEY))
}
export function setPin(pin: string): void {
  localStorage.setItem(KEY, hash(pin))
}
export function clearPin(): void {
  localStorage.removeItem(KEY)
}
export function verifyPin(pin: string): boolean {
  return localStorage.getItem(KEY) === hash(pin)
}
