// Free in-chat translation (#94) via Lingva — a Google-Translate proxy that
// auto-detects the source language and needs no API key. We try a couple of
// public instances for resilience. (We don't fall back to a source-specific
// API because we can't know the message's source language to pass it.)
const LINGVA_HOSTS = ['https://lingva.ml', 'https://lingva.garudalinux.org']

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function translateText(text: string, target: string): Promise<string | null> {
  const q = encodeURIComponent(text)
  for (const host of LINGVA_HOSTS) {
    try {
      const r = await fetchWithTimeout(`${host}/api/v1/auto/${target}/${q}`)
      if (r.ok) {
        const d = await r.json()
        if (d && typeof d.translation === 'string') return d.translation
      }
    } catch {
      /* try next host */
    }
  }
  return null
}
