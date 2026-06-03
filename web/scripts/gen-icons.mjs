import zlib from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

// --- tiny PNG encoder (RGBA, 8-bit) ---
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function png(size, rgba) {
  const raw = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0
    rgba.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const A = [0xff, 0x6b, 0x8b]
const B = [0x9b, 0x6d, 0xff]
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function makeIcon(size, dotScale) {
  const rgba = Buffer.alloc(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const r = size * dotScale
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size)
      let R = lerp(A[0], B[0], t)
      let G = lerp(A[1], B[1], t)
      let Bl = lerp(A[2], B[2], t)
      const d = Math.hypot(x - cx, y - cy)
      if (d < r) {
        const edge = Math.min(1, (r - d) / 4)
        R = lerp(R, 255, edge)
        G = lerp(G, 255, edge)
        Bl = lerp(Bl, 255, edge)
      }
      const i = (y * size + x) * 4
      rgba[i] = R
      rgba[i + 1] = G
      rgba[i + 2] = Bl
      rgba[i + 3] = 255
    }
  }
  return png(size, rgba)
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', makeIcon(192, 0.17))
writeFileSync('public/icon-512.png', makeIcon(512, 0.17))
writeFileSync('public/icon-maskable-512.png', makeIcon(512, 0.13))
writeFileSync('public/apple-touch-icon.png', makeIcon(180, 0.17))
console.log('icons written to public/')
