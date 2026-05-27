import fs from 'node:fs'
import zlib from 'node:zlib'

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = data.length
  const out = Buffer.alloc(8 + len)
  out.writeUInt32BE(len, 0)
  out.write(type, 4, 4)
  data.copy(out, 8)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])), 0)
  return Buffer.concat([out, crcBuf])
}

function png(size, rgb) {
  const row = 1 + size * 3
  const raw = Buffer.alloc(row * size)
  for (let y = 0; y < size; y++) {
    raw[y * row] = 0
    for (let x = 0; x < size; x++) {
      const i = y * row + 1 + x * 3
      raw[i] = rgb[0]
      raw[i + 1] = rgb[1]
      raw[i + 2] = rgb[2]
    }
  }
  const z = zlib.deflateSync(raw)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', z),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const dir = 'public/icons'
fs.mkdirSync(dir, { recursive: true })
const bg = [7, 6, 18]
fs.writeFileSync(`${dir}/icon-192.png`, png(192, bg))
fs.writeFileSync(`${dir}/icon-512.png`, png(512, bg))
console.log('Wrote icon-192.png and icon-512.png')
