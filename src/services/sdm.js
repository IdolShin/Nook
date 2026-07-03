// ─── NTAG 424 DNA SDM (SUN) verification ─────────────────────
// Implements NXP AN12196: decrypt PICCData (AES-128-CBC, zero IV)
// and verify SDMMAC using session key derived from K_SDMFileRead.
// Pure Node crypto — no external dependencies.

const crypto = require('crypto')

function aesEcbEncrypt(key, data) {
  const c = crypto.createCipheriv('aes-128-ecb', key, null)
  c.setAutoPadding(false)
  return Buffer.concat([c.update(data), c.final()])
}

function shiftLeft(buf) {
  const out = Buffer.alloc(buf.length)
  let carry = 0
  for (let i = buf.length - 1; i >= 0; i--) {
    const v = (buf[i] << 1) | carry
    out[i] = v & 0xff
    carry = (v >> 8) & 1
  }
  return out
}

function xorBuf(a, b) {
  const out = Buffer.alloc(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i]
  return out
}

// AES-CMAC (RFC 4493)
function aesCmac(key, message) {
  const L = aesEcbEncrypt(key, Buffer.alloc(16))
  const K1 = shiftLeft(L)
  if (L[0] & 0x80) K1[15] ^= 0x87
  const K2 = shiftLeft(K1)
  if (K1[0] & 0x80) K2[15] ^= 0x87

  const n = message.length === 0 ? 1 : Math.ceil(message.length / 16)
  const lastComplete = message.length > 0 && message.length % 16 === 0

  let lastBlock
  if (lastComplete) {
    lastBlock = xorBuf(message.slice((n - 1) * 16), K1)
  } else {
    const rem = message.slice((n - 1) * 16)
    const padded = Buffer.concat([rem, Buffer.from([0x80]), Buffer.alloc(16 - rem.length - 1)])
    lastBlock = xorBuf(padded, K2)
  }

  let x = Buffer.alloc(16)
  for (let i = 0; i < n - 1; i++) {
    x = aesEcbEncrypt(key, xorBuf(x, message.slice(i * 16, i * 16 + 16)))
  }
  return aesEcbEncrypt(key, xorBuf(x, lastBlock))
}

// Decrypt PICCData (16 bytes) with K_SDMMetaRead.
// Returns { uid, ctr } or null if the plaintext doesn't look valid.
function decryptPiccData(metaKeyHex, piccHex) {
  try {
    const key = Buffer.from(metaKeyHex, 'hex')
    const data = Buffer.from(piccHex, 'hex')
    if (key.length !== 16 || data.length !== 16) return null

    const d = crypto.createDecipheriv('aes-128-cbc', key, Buffer.alloc(16))
    d.setAutoPadding(false)
    const plain = Buffer.concat([d.update(data), d.final()])

    const tag = plain[0]
    // PICCDataTag: bit7 = UID mirror, bit6 = SDMReadCtr mirror, bits0-3 = UID length (7)
    const hasUid = !!(tag & 0x80)
    const hasCtr = !!(tag & 0x40)
    const uidLen = tag & 0x0f
    if (!hasUid || !hasCtr || uidLen !== 7) return null

    const uid = plain.slice(1, 8).toString('hex').toUpperCase()
    const ctr = plain[8] | (plain[9] << 8) | (plain[10] << 16) // LSB first
    return { uid, ctr }
  } catch {
    return null
  }
}

// Verify SDMMAC. sdmmac covers empty input when no SDMMACInputOffset data.
// Session key: SV2 = 3C C3 00 01 00 80 || UID(7) || SDMReadCtr(3, LSB first)
function verifySdmMac(fileKeyHex, uidHex, ctr, cmacHex) {
  try {
    const fileKey = Buffer.from(fileKeyHex, 'hex')
    if (fileKey.length !== 16) return false

    const sv2 = Buffer.concat([
      Buffer.from([0x3c, 0xc3, 0x00, 0x01, 0x00, 0x80]),
      Buffer.from(uidHex, 'hex'),
      Buffer.from([ctr & 0xff, (ctr >> 8) & 0xff, (ctr >> 16) & 0xff])
    ])
    if (sv2.length !== 16) return false

    const sessionKey = aesCmac(fileKey, sv2)
    const fullMac = aesCmac(sessionKey, Buffer.alloc(0))

    // Truncate: take odd-indexed bytes (1,3,...,15) → 8 bytes
    const truncated = Buffer.alloc(8)
    for (let i = 0; i < 8; i++) truncated[i] = fullMac[i * 2 + 1]

    const expected = truncated.toString('hex').toUpperCase()
    const given = String(cmacHex || '').trim().toUpperCase()
    if (given.length !== 16) return false
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(given, 'hex'))
  } catch {
    return false
  }
}

module.exports = { decryptPiccData, verifySdmMac, aesCmac }
