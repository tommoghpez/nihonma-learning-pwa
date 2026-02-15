// ベビーティランPWAアイコン生成スクリプト
// Pure Node.js - 外部依存なし
import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

const pixels = [
  '        DDDDD           ',
  '       DGGGGGD          ',
  '      DGgLLLgGD         ',
  '     DGg WEWE gD       ',
  '     DGgP      PgD      ',
  '      DGgMMMMMgGD       ',
  '       DDDGGGDD         ',
  '        DcCCcD          ',
  '       DcCCCCcD         ',
  '      DcCCCCCCcD        ',
  '       DcCCCCcD         ',
  '        DcCCcD          ',
  '       Dt    tD         ',
  '      TTT    TTT        ',
]

const colors = {
  D: [27, 94, 32], G: [46, 125, 50], g: [76, 175, 80], L: [129, 199, 132],
  C: [255, 249, 196], c: [255, 245, 157], E: [33, 33, 33], W: [255, 255, 255],
  P: [255, 138, 128], M: [211, 47, 47], T: [93, 64, 55], t: [121, 85, 72],
}

const BG = [27, 54, 93] // navy background

function generatePNG(targetSize) {
  const srcW = 24
  const srcH = 14
  // ピクセルアートを中央配置
  const scale = Math.floor(targetSize / Math.max(srcW, srcH) * 0.7)
  const offsetX = Math.floor((targetSize - srcW * scale) / 2)
  const offsetY = Math.floor((targetSize - srcH * scale) / 2)

  // RGBA画像データ生成
  const rawData = Buffer.alloc(targetSize * (targetSize * 4 + 1)) // +1 for filter byte per row
  let pos = 0
  for (let y = 0; y < targetSize; y++) {
    rawData[pos++] = 0 // filter: none
    for (let x = 0; x < targetSize; x++) {
      // ピクセルアートの座標にマッピング
      const srcX = Math.floor((x - offsetX) / scale)
      const srcY = Math.floor((y - offsetY) / scale)

      let r = BG[0], g = BG[1], b = BG[2], a = 255

      if (srcX >= 0 && srcX < srcW && srcY >= 0 && srcY < srcH &&
          x >= offsetX && y >= offsetY &&
          x < offsetX + srcW * scale && y < offsetY + srcH * scale) {
        const ch = pixels[srcY]?.[srcX]
        if (ch && ch !== ' ' && colors[ch]) {
          ;[r, g, b] = colors[ch]
        }
      }

      // 角丸（アイコン風）
      const cx = targetSize / 2, cy = targetSize / 2
      const radius = targetSize * 0.42
      const cornerRadius = targetSize * 0.18
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy)
      if (dx > radius - cornerRadius && dy > radius - cornerRadius) {
        const cdx = dx - (radius - cornerRadius)
        const cdy = dy - (radius - cornerRadius)
        if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerRadius) {
          a = 0
          r = g = b = 0
        }
      } else if (dx > radius || dy > radius) {
        a = 0
        r = g = b = 0
      }

      rawData[pos++] = r
      rawData[pos++] = g
      rawData[pos++] = b
      rawData[pos++] = a
    }
  }

  // PNG構築
  const compressed = deflateSync(rawData)
  const chunks = []

  // Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))

  function makeChunk(type, data) {
    const typeB = Buffer.from(type)
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const combined = Buffer.concat([typeB, data])
    const crc = crc32(combined)
    const crcB = Buffer.alloc(4)
    crcB.writeUInt32BE(crc >>> 0)
    return Buffer.concat([len, combined, crcB])
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(targetSize, 0)
  ihdr.writeUInt32BE(targetSize, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // RGBA
  chunks.push(makeChunk('IHDR', ihdr))

  // IDAT
  chunks.push(makeChunk('IDAT', compressed))

  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0)))

  return Buffer.concat(chunks)
}

// CRC32 implementation
function crc32(buf) {
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

// 生成
writeFileSync('public/pwa-192x192.png', generatePNG(192))
writeFileSync('public/pwa-512x512.png', generatePNG(512))
writeFileSync('public/apple-touch-icon.png', generatePNG(180))
console.log('Icons generated: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png')

// favicon.svg
const svgRects = []
pixels.forEach((row, y) => {
  for (let x = 0; x < row.length; x++) {
    const ch = row[x]
    if (ch !== ' ' && colors[ch]) {
      const [r, g, b] = colors[ch]
      svgRects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`)
    }
  }
})
const faviconSvg = `<svg viewBox="-2 -1 28 16" xmlns="http://www.w3.org/2000/svg">
<rect x="-2" y="-1" width="28" height="16" rx="3" fill="#1B365D"/>
${svgRects.join('\n')}
</svg>`
writeFileSync('public/favicon.svg', faviconSvg)
console.log('Generated: favicon.svg')
