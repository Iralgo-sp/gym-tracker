// One-off script: procedurally draws a simple dumbbell PWA icon (no
// external image-processing dependency needed) and writes it as PNG
// at the sizes required by the web app manifest.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// --- minimal PNG encoder -------------------------------------------------

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c >>> 0
}
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type: RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = chunk('IHDR', ihdrData)

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter type: None
    rgbaBuffer.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = chunk('IDAT', zlib.deflateSync(raw, { level: 9 }))
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

// --- tiny raster helpers --------------------------------------------------

function createCanvas(size) {
  return Buffer.alloc(size * size * 4)
}

function setPixel(buf, size, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= size || y >= size) return
  const idx = (y * size + x) * 4
  buf[idx] = r
  buf[idx + 1] = g
  buf[idx + 2] = b
  buf[idx + 3] = a
}

function fillRect(buf, size, x0, y0, w, h, r, g, b, a, radius = 0) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (radius > 0) {
        const cx = Math.min(Math.max(x, x0 + radius), x0 + w - radius)
        const cy = Math.min(Math.max(y, y0 + radius), y0 + h - radius)
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy > radius * radius) continue
      }
      setPixel(buf, size, x, y, r, g, b, a)
    }
  }
}

// --- icon drawing ----------------------------------------------------------

function drawDumbbell(size, { padding = 0.18, bg = [79, 70, 229], fg = [255, 255, 255] } = {}) {
  const buf = createCanvas(size)
  const bgRadius = Math.round(size * 0.22)
  fillRect(buf, size, 0, 0, size, size, bg[0], bg[1], bg[2], 255, bgRadius)

  const pad = Math.round(size * padding)
  const barY = Math.round(size / 2 - size * 0.035)
  const barH = Math.round(size * 0.07)
  const barX = pad + Math.round(size * 0.12)
  const barW = size - 2 * barX
  fillRect(buf, size, barX, barY, barW, barH, fg[0], fg[1], fg[2], 255, Math.round(barH / 2))

  const plateW = Math.round(size * 0.09)
  const plateH = Math.round(size * 0.42)
  const plateY = Math.round(size / 2 - plateH / 2)
  fillRect(buf, size, pad, plateY, plateW, plateH, fg[0], fg[1], fg[2], 255, Math.round(plateW / 2))
  fillRect(
    buf,
    size,
    size - pad - plateW,
    plateY,
    plateW,
    plateH,
    fg[0],
    fg[1],
    fg[2],
    255,
    Math.round(plateW / 2),
  )

  const collarW = Math.round(size * 0.07)
  const collarH = Math.round(size * 0.26)
  const collarY = Math.round(size / 2 - collarH / 2)
  const collarX1 = pad + plateW + Math.round(size * 0.02)
  const collarX2 = size - pad - plateW - collarW - Math.round(size * 0.02)
  fillRect(buf, size, collarX1, collarY, collarW, collarH, fg[0], fg[1], fg[2], 255, Math.round(collarW / 2))
  fillRect(buf, size, collarX2, collarY, collarW, collarH, fg[0], fg[1], fg[2], 255, Math.round(collarW / 2))

  return buf
}

function writeIcon(filePath, size, opts) {
  const png = encodePNG(size, size, drawDumbbell(size, opts))
  fs.writeFileSync(filePath, png)
  console.log('wrote', filePath)
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

writeIcon(path.join(outDir, 'icon-192.png'), 192, { padding: 0.18 })
writeIcon(path.join(outDir, 'icon-512.png'), 512, { padding: 0.18 })
writeIcon(path.join(outDir, 'icon-maskable-512.png'), 512, { padding: 0.32 })
writeIcon(path.join(outDir, 'apple-touch-icon.png'), 180, { padding: 0.18 })

console.log('Icons generated in', outDir)
