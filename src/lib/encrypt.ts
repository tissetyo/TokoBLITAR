import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
} from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set')
    return Buffer.from(key, 'hex')
}

export function encrypt(text: string): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv(ALGO, getKey(), iv)
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
    ])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(data: string): string {
    const buf = Buffer.from(data, 'base64')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const encrypted = buf.subarray(28)
    const decipher = createDecipheriv(ALGO, getKey(), iv)
    decipher.setAuthTag(tag)
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
