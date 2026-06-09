// Free in-chat translation (#94) via Lingva — a Google-Translate proxy that
// auto-detects the source language and needs no API key. We try a couple of
// public instances for resilience and fall back to MyMemory.
const LINGVA_HOSTS = ['https://lingva.ml', 'https://lingva.garudalinux.org']

export async function translateText(text: string, target: string): Promise<string | null> {
  const q = encodeURIComponent(text)
  for (const host of LINGVA_HOSTS) {
    try {
      const r = await fetch(`${host}/api/v1/auto/${target}/${q}`)
      if (r.ok) {
        const d = await r.json()
        if (d && typeof d.translation === 'string') return d.translation
      }
    } catch {
      /* try next host */
    }
  }
  // Fallback: MyMemory (also free, no key).
  try {
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${q}&langpair=en|${target}`,
    )
    const d = await r.json()
    const t = d && d.responseData && d.responseData.translatedText
    return typeof t === 'string' ? t : null
  } catch {
    return null
  }
}
